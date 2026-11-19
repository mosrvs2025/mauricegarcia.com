const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let sent;
let deliveries = [];
let confirmationError = false;
let providerError = null;
function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => mocks[name] || require(name), process, URL, Request, Response, console });
  return exports;
}
const contact = load('lib/contact.ts');
const emails = load('lib/contact-emails.ts', { './contact': contact });
const { POST } = load('app/api/contact/route.ts', {
  '@/lib/contact-emails': emails, '@/lib/contact': contact,
  'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  resend: { Resend: class { emails = { send: async payload => { deliveries.push(payload); if (payload.to === contact.contactEmail) sent = payload; return { error: providerError || (confirmationError && payload.to !== contact.contactEmail ? { message: "Confirmation rejected" } : null) }; } }; } },
});
// The whole contract: a message (10 to 3,000 characters) and an email are required; a name is optional.
// Objects from the vm sandbox have another realm's prototype; compare plain copies.
const plain = (v) => JSON.parse(JSON.stringify(v));
const valid = { message: 'Played REALMBREAK, loved the beam clash.', email: 'friend@example.com' };
const request = (body, origin = 'https://www.mauricegarcia.com') => new Request('https://www.mauricegarcia.com/api/contact', { method: 'POST', headers: { origin }, body: JSON.stringify(body) });
(async () => {
  // Server-side validation and trimming.
  assert.deepEqual(plain(contact.parseInquiry({ ...valid, message: '  ' + valid.message + '  ', email: ' friend@example.com ' })), { message: valid.message, email: valid.email, name: '', companyFax: '' });
  assert.equal(contact.parseInquiry({ ...valid, email: {} }), null);
  assert.equal(contact.parseInquiry({ ...valid, email: 'invalid' }), null);
  assert.equal(contact.parseInquiry({ ...valid, email: '' }), null, 'email is required');
  assert.equal(contact.parseInquiry({ email: valid.email }), null, 'message is required');
  assert.equal(contact.parseInquiry({ ...valid, message: 'too short' }), null, 'under 10 characters');
  assert.ok(contact.parseInquiry({ ...valid, message: 'a'.repeat(3000) }), '3,000 characters is fine');
  assert.equal(contact.parseInquiry({ ...valid, message: 'a'.repeat(3001) }), null, 'over 3,000 characters');
  assert.ok(contact.parseInquiry({ ...valid, name: 'N'.repeat(80) }), 'an 80-character name is fine');
  assert.equal(contact.parseInquiry({ ...valid, name: 'N'.repeat(81) }), null, 'names stop at 80 characters');
  assert.equal(contact.parseInquiry({ ...valid, name: 'Line\nBreak' }), null, 'no line breaks in a name');
  assert.equal(contact.parseInquiry({ ...valid, email: 'a@b.co\nBcc: x@y.z' }), null, 'no header injection through the address');
  // Older clients and stray fields: `body` still works as the message, and intent, budget, timeline or service are neither required nor used.
  assert.equal(contact.parseInquiry({ body: valid.message, email: valid.email }).message, valid.message);
  assert.deepEqual(Object.keys(contact.parseInquiry({ ...valid, intent: 'paid-work', budget: '$50,000+', timeline: 'ASAP', service: 'x' })).sort(), ['companyFax', 'email', 'message', 'name']);
  // Origin, honeypot and missing configuration.
  assert.equal((await POST(request(valid, 'https://elsewhere.example'))).status, 403);
  assert.equal((await POST(request({ ...valid, companyFax: 'spam' }))).status, 400);
  assert.equal((await POST(request({ ...valid, message: 'short' }))).status, 400);
  const oldKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  assert.equal((await POST(request(valid))).status, 503);
  process.env.RESEND_API_KEY = 'test-mocked';
  // Delivery: fixed recipient, the visitor only ever as a validated replyTo; no name needed.
  const ok = await POST(request(valid));
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).ok, true);
  assert.equal(sent.to, 'hello@mauricegarcia.com');
  assert.equal(sent.replyTo, valid.email);
  assert.match(sent.subject, /Website message from friend@example\.com/);
  assert.match(sent.text, /Played REALMBREAK/);
  assert.doesNotMatch(sent.text, /Name:|Intent|Budget|Timeline|Service/);
  contact.resetSubmissions();
  assert.equal((await POST(request({ ...valid, name: 'Friend' }))).status, 200);
  assert.match(sent.subject, /from Friend/);
  assert.match(sent.text, /Name: Friend/);
  assert.match(sent.html, /Reply to Friend/);
  assert.equal(deliveries.at(-1).to, valid.email);
  assert.equal(deliveries.at(-1).replyTo, contact.contactEmail);
  assert.match(deliveries.at(-1).html, /automatic confirmation/);
  // Untrusted text is escaped in the owner email.
  const escaped = emails.contactEmails({ ...valid, name: "<img>", message: "<script>alert(1)</script>", companyFax: '' });
  assert.doesNotMatch(escaped.owner.html, /<script>|<img>/);
  // The unverified address never receives anything the visitor typed: no name, no message text.
  const echoed = emails.contactEmails({ ...valid, name: "ZZNAMEZZ", message: "ZZBODYZZ spam text", companyFax: '' }).visitor;
  assert.doesNotMatch(echoed.html + echoed.text, /ZZNAMEZZ|ZZBODYZZ|spam text/);
  assert.match(echoed.text, /ignore this email/);
  // Provider failure: no success is reported.
  contact.resetSubmissions();
  providerError = { message: 'Rejected' };
  const failed = await POST(request(valid));
  assert.equal(failed.status, 502);
  assert.equal((await failed.json()).ok, undefined);
  providerError = null;
  // A rejected confirmation does not undo a delivered message.
  contact.resetSubmissions();
  confirmationError = true;
  const partial = await POST(request(valid));
  assert.equal(partial.status, 200);
  assert.equal((await partial.json()).confirmationSent, false);
  confirmationError = false;
  // Proportionate spam protection: link floods and bursts from one client are refused with honest messages.
  assert.equal((await POST(request({ ...valid, message: 'http://a.example http://b.example http://c.example http://d.example' }))).status, 400);
  contact.resetSubmissions();
  const burst = () => new Request('https://www.mauricegarcia.com/api/contact', { method: 'POST', headers: { origin: 'https://www.mauricegarcia.com', 'x-forwarded-for': '203.0.113.9' }, body: JSON.stringify(valid) });
  const codes = []; for (let i = 0; i < 7; i++) codes.push((await POST(burst())).status);
  assert.deepEqual(plain(codes), [200, 200, 200, 200, 200, 429, 429]);
  contact.resetSubmissions();
  // Message bodies are never logged by the route.
  assert.doesNotMatch(fs.readFileSync('app/api/contact/route.ts', 'utf8'), /console\.\w+\([^)]*(message|inquiry)/);
  if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
  console.log('Contact checks passed: message and email required, optional name, length limits, trimming, header-injection, honeypot, link flood, rate limit, origin, missing configuration, recipient, reply-to, escaping, no echo to visitors, and provider failure. No real email sent.');
})().catch(error => { console.error(error); process.exitCode = 1; });

