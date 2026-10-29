# mauricegarcia.com

Maurice Garcia's identity, portfolio, innovation lab and business platform: projects in three tracks, a Learn section, short updates, writing, a Now page, whole-site style switching, and ways to work together. Next.js (App Router), TypeScript, Tailwind v4. No database; content is files in this repository.

## Run it

```bash
npm install
npm run dev                       # http://localhost:3000
SITE_PREVIEW=1 npm run dev        # also shows "proposed" content awaiting approval
```

Copy `.env.example` to `.env.local`.

## Check it

```bash
npm run typecheck
npm run demos:check              # every public demo link answers (add -- --browser for a real-browser check)
npm run content:validate          # every content file against its schema + cross-references
npm test                          # contact flow, sync, studio, content visibility
NEXT_DIST_DIR=.next-prod npm run build && NEXT_DIST_DIR=.next-prod npm run leak-check
```

## Map

| | |
| --- | --- |
| `content/` | Projects, updates, posts, `now.json`, `sources.json`, machine candidates |
| `lib/content/` | Schemas, loader, visibility rules (`visibility.ts` is the one gate), safe Markdown |
| `lib/sync/`, `scripts/sync.ts` | GitHub → candidates → drafts; publication rule |
| `lib/studio/`, `app/studio/`, `app/api/studio/` | Owner editor: auth, Git-backed store, save/publish/rollback |
| `.github/workflows/` | `sync.yml` (scheduled + manual), `ci.yml` |
| `docs/` | `OWNER_GUIDE.md`, `AGENT_HANDOFF.md`, `AGENT_SNIPPET.md`, `INVENTORY.md`, JSON Schema |

Routes: `/`, `/learn`, `/learn/[slug]`, `/projects`, `/projects/[slug]`, `/writing`, `/writing/[slug]`, `/updates`, `/updates/[slug]`, `/now`, `/about`, `/connect`, `/lab` (design lab: the same content in six styles), plus the existing `/services`, `/coaching`, `/ai-receptionist`, `/shop`, `/ads`. Feeds: `/writing/rss.xml`, `/updates/rss.xml`. Moved: `/contact`→`/connect`, `/work`→`/projects/pipeline-crm`. Studio: `/studio` (off until configured).

## Contact, shop and hosting

Unchanged in principle: contact submissions need `RESEND_API_KEY` and a verified `CONTACT_FROM_EMAIL`, go to hello@mauricegarcia.com with the visitor as Reply-To, and fail honestly with a direct-email fallback. The shop falls back to email without Stripe keys. Incoming mail is handled by Porkbun forwarding; Resend sends outbound form notifications. **Do not change DNS or MX records.** Import the repo on Vercel and set env from `.env.example`.
