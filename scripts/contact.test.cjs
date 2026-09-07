const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let sent;
let providerError = null;
function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => mocks[name] || require(name), process, URL, Request, Response, console });
  return exports;
}
const contact = load('lib/contact.ts');
const services = load('lib/services.ts');
const { POST } = load('app/api/contact/route.ts', {
  '@/lib/contact': contact, '@/lib/services': services,
  'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  resend: { Resend: class { emails = { send: async payload => { sent = payload; return { error: providerError }; } }; } },
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
  assert.equal(sent.to, 'maurice.garcia+site@gmail.com');
  assert.equal(sent.replyTo, valid.email);
  assert.match(sent.text, /Budget: \$1,000/);
  assert.match(sent.text, /Business: Example Co/);
  providerError = { message: 'Rejected' };
  assert.equal((await POST(request(valid))).status, 502);
  if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
  console.log('Contact checks passed: validation, spam field, origin, missing configuration, recipient, reply-to, brief, and provider failure. No real email sent.');
})().catch(error => { console.error(error); process.exitCode = 1; });
