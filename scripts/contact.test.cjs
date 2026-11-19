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
const minimal = { email: 'visitor@example.com', message: 'Hello Maurice, I loved trying out your demos.' };
const withName = { name: 'Friend', email: 'friend@example.com', message: 'Played REALMBREAK and wanted to say hello!' };
const request = (body, origin = 'https://www.mauricegarcia.com') => new Request('https://www.mauricegarcia.com/api/contact', { method: 'POST', headers: { origin }, body: JSON.stringify(body) });
(async () => {
  // Validation: message (10-3000) and email are the only required fields; name is optional (max 80).
  assert.ok(contact.parseInquiry(minimal), 'message + email alone is valid');
  assert.equal(contact.parseInquiry(minimal).name, '');
  assert.ok(contact.parseInquiry(withName), 'optional name is accepted');
  assert.equal(contact.parseInquiry({ ...minimal, email: {} }), null);
  assert.equal(contact.parseInquiry({ ...minimal, email: 'invalid' }), null);
  assert.equal(contact.parseInquiry({ ...minimal, message: 'short' }), null, 'message under 10 chars rejected');
  assert.equal(contact.parseInquiry({ ...minimal, message: 'a'.repeat(3001) }), null, 'message over 3000 chars rejected');
  assert.equal(contact.parseInquiry({ ...minimal, name: 'n'.repeat(81) }), null, 'name over 80 chars rejected');
  assert.equal(contact.parseInquiry({ ...minimal, name: 'bad\r\nheader' }), null, 'newlines in name rejected');

  // Security & configuration guards
  assert.equal((await POST(request(minimal, 'https://elsewhere.example'))).status, 403);
  assert.equal((await POST(request({ ...minimal, companyFax: 'spam' }))).status, 400);
  const oldKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  assert.equal((await POST(request(minimal))).status, 503);
  process.env.RESEND_API_KEY = 'test-mocked';

  // Successful delivery without optional name
  assert.equal((await POST(request(minimal))).status, 200);
  assert.equal(sent.to, 'hello@mauricegarcia.com');
  assert.equal(sent.replyTo, minimal.email);
  assert.match(sent.text, /Hello Maurice/);
  assert.doesNotMatch(sent.text, /Name:/);

  // Provider failure returns honest error
  providerError = { message: 'Rejected' };
  const failRes = await POST(request(minimal));
  assert.equal(failRes.status, 502);
  assert.match((await failRes.json()).error, /Couldn't send your message/);

  // Delivery with optional name & safe visitor confirmation
  contact.resetSubmissions();
  providerError = null;
  assert.equal((await POST(request(withName))).status, 200);
  assert.equal(deliveries.at(-1).to, withName.email);
  assert.equal(deliveries.at(-1).replyTo, contact.contactEmail);
  assert.match(deliveries.at(-1).html, /automatic confirmation/);
  assert.match(sent.html, /Reply to Friend/);

  // Untrusted HTML escaping
  const escaped = emails.contactEmails({ ...withName, name: "<img>", message: "<script>alert(1)</script>" });
  assert.doesNotMatch(escaped.owner.html, /<script>|<img>/);

  // The unverified address never receives anything the visitor typed: no name, no message text.
  const echoed = emails.contactEmails({ ...withName, name: "ZZNAMEZZ", message: "ZZBODYZZ spam text here" }).visitor;
  assert.doesNotMatch(echoed.html + echoed.text, /ZZNAMEZZ|ZZBODYZZ|spam text/);
  assert.match(echoed.text, /ignore this email/);

  // Partial confirmation failure still succeeds after owner notification is accepted
  contact.resetSubmissions();
  confirmationError = true;
  const partial = await POST(request(withName));
  assert.equal(partial.status, 200);
  assert.equal((await partial.json()).confirmationSent, false);
  confirmationError = false;

  // Proportionate spam protection: link floods and bursts from one client are refused with honest messages.
  assert.equal((await POST(request({ ...withName, message: 'http://a.example http://b.example http://c.example http://d.example' }))).status, 400);
  contact.resetSubmissions();
  const burst = () => new Request('https://www.mauricegarcia.com/api/contact', { method: 'POST', headers: { origin: 'https://www.mauricegarcia.com', 'x-forwarded-for': '203.0.113.9' }, body: JSON.stringify(withName) });
  const codes = []; for (let i = 0; i < 7; i++) codes.push((await POST(burst())).status);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429, 429]);
  contact.resetSubmissions();

  if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
  console.log('Contact checks passed: validation (message + email required, optional name), spam field, link flood, rate limit, origin, missing configuration, recipient, reply-to, escaping, confirmation safety, and provider failure. No real email sent.');
})().catch(error => { console.error(error); process.exitCode = 1; });
