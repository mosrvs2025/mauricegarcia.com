# mauricegarcia.com

Personal site for Maurice Garcia.
Independent full-stack engineer in California.
Builds software for small businesses.
Flagship: Pipeline CRM for Don Howard Construction / Painting.
https://pl.donhowardconstruction.com/

## Stack
Next.js App Router, TypeScript, Tailwind v4.

## Local
npm install
npm run dev
Copy .env.example to .env.local

## Config
See .env.example. Shop falls back to email. Contact submissions require RESEND_API_KEY and a verified CONTACT_FROM_EMAIL. They send directly to hello@mauricegarcia.com (lib/contact.ts), with the customer as Reply-To. Missing configuration returns an honest failure and the form offers a direct email link. No filesystem inbox is used. Run node scripts/contact.test.cjs for mocked delivery checks.

## Hosting
Import this repo on Vercel. Set env from .env.example. Attach mauricegarcia.com in Vercel Domains and follow their DNS UI.

## Routes
/, /work, /services, /shop, /about, /contact




Incoming mail for hello@mauricegarcia.com is handled separately by Porkbun forwarding to maurice.garcia+site@gmail.com. Resend handles outbound form notifications; keep the root domain MX records pointed at Porkbun.
