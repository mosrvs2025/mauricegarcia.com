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
const services = load('lib/services.ts');
const emails = load('lib/contact-emails.ts', { './contact': contact });
const { POST } = load('app/api/contact/route.ts', {
  '@/lib/contact-emails': emails, '@/lib/contact': contact, '@/lib/services': services,
  'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  resend: { Resend: class { emails = { send: async payload => { deliveries.push(payload); if (payload.to === contact.contactEmail) sent = payload; return { error: providerError || (confirmationError && payload.to !== contact.contactEmail ? { message: "Confirmation rejected" } : null) }; } }; } },
});
const valid = { name: 'Test Client', email: 'client@example.com', body: 'I need booking inquiries.', service: 'business-website', budget: '$1,000–$3,000', timeline: 'Within a month', business: 'Example Co' };
const request = (body, origin = 'https://www.mauricegarcia.com') => new Request('https://www.mauricegarcia.com/api/contact', { method: 'POST', headers: { origin }, body: JSON.stringify(body) });
(async () => {
  assert.equal(contact.parseInquiry({ ...valid, email: {} }), null);
  assert.equal(contact.parseInquiry({ ...valid, email: 'invalid' }), null);
  assert.equal(contact.parseInquiry({ ...valid, body: 'a'.repeat(5001) }), null);
  assert.equal((await POST(request(valid, 'https://elsewhere.example'))).status, 403);
  assert.equal((await POST(request({ ...valid, companyFax: 'spam' }))).status, 400);
  const oldKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  assert.equal((await POST(request(valid))).status, 503);
  process.env.RESEND_API_KEY = 'test-mocked';
  assert.equal((await POST(request(valid))).status, 200);
  assert.equal(sent.to, 'hello@mauricegarcia.com');
  assert.equal(sent.replyTo, valid.email);
  assert.match(sent.text, /Budget: \$1,000/);
  assert.match(sent.text, /Business: Example Co/);
  providerError = { message: 'Rejected' };
  assert.equal((await POST(request(valid))).status, 502);
  // New connect-form fields: intent and project carry through; budget stays optional.
  contact.resetSubmissions();
  providerError = null;
  const hello = { name: 'Friend', email: 'friend@example.com', body: 'Played Gridheart, loved it.', intent: 'collaborate', project: 'gridheart' };
  assert.equal((await POST(request(hello))).status, 200);
  assert.match(sent.text, /Intent: Collaboration/);
  assert.match(sent.text, /Project: gridheart \(https:\/\/mauricegarcia.com\/projects\/gridheart\)/);
  assert.doesNotMatch(sent.text, /Not provided|Service: None/);
  assert.equal(deliveries.at(-1).to, hello.email);
  assert.equal(deliveries.at(-1).replyTo, contact.contactEmail);
  assert.match(deliveries.at(-1).html, /automatic confirmation/);
  assert.match(sent.html, /Reply to Friend/);
  const escaped = emails.contactEmails({ ...hello, name: "<img>", body: "<script>alert(1)</script>" }, "Hello");
  assert.doesNotMatch(escaped.owner.html, /<script>|<img>/);
  // The unverified address never receives anything the visitor typed: no name, no message text.
  const echoed = emails.contactEmails({ ...hello, name: "ZZNAMEZZ", body: "ZZBODYZZ spam text" }, "Hello").visitor;
  assert.doesNotMatch(echoed.html + echoed.text, /ZZNAMEZZ|ZZBODYZZ|spam text/);
  assert.match(echoed.text, /ignore this email/);
  contact.resetSubmissions();
  confirmationError = true;
  const partial = await POST(request(hello));
  assert.equal(partial.status, 200);
  assert.equal((await partial.json()).confirmationSent, false);
  confirmationError = false;
  assert.match(sent.subject, /Collaboration/);
  assert.equal(contact.parseInquiry({ ...hello, intent: 'sell-me-things' }), null);
  assert.equal(contact.parseInquiry({ ...hello, project: '../../etc' }), null);
  // Proportionate spam protection: link floods and bursts from one client are refused with honest messages.
  assert.equal((await POST(request({ ...hello, body: 'http://a.example http://b.example http://c.example http://d.example' }))).status, 400);
  contact.resetSubmissions();
  const burst = () => new Request('https://www.mauricegarcia.com/api/contact', { method: 'POST', headers: { origin: 'https://www.mauricegarcia.com', 'x-forwarded-for': '203.0.113.9' }, body: JSON.stringify(hello) });
  const codes = []; for (let i = 0; i < 7; i++) codes.push((await POST(burst())).status);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429, 429]);
  contact.resetSubmissions();
  if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
  console.log('Contact checks passed: validation, spam field, link flood, rate limit, origin, missing configuration, recipient, reply-to, intent/project context, and provider failure. No real email sent.');
})().catch(error => { console.error(error); process.exitCode = 1; });

