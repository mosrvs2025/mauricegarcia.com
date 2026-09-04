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
See .env.example. Shop falls back to email. In local development, contact submissions fall back to `data/inbox.json`, which is gitignored. Production requires Resend configuration and never writes submissions to Vercel's filesystem.

## Hosting
Import this repo on Vercel. Set env from .env.example. Attach mauricegarcia.com in Vercel Domains and follow their DNS UI.

## Routes
/, /work, /services, /shop, /about, /contact

