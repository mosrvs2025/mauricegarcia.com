<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Keep the portfolio current

Preserve the live demos, interactive project presentation, media previews and site styles. When adding a public-repository project, also add its verified repository and branch to `content/sources.json`; the portfolio test checks coverage. Do not infer deployed functionality from commits. After a visitor-visible feature ships, check the matching project's demo link, capabilities, limitations and screenshots/video, following `docs/AGENT_SNIPPET.md`. Private source repositories remain excluded from automated imports.

## Non-negotiables (any agent or contributor)

These are the owner's standing decisions. Do not change them without the owner saying so in their own words.

- **Never push to main.** Work on a branch and open a PR. Do not merge or deploy until the owner has reviewed it. Never force-push.
- **Identity:** Maurice Garcia is an Experience Engineer, creative technologist and independent builder. Do not describe him as a web developer, freelancer or agency.
- **Pricing:** custom quote only. Do not invent fixed prices, packages, discounts or promises.
- **Trust:** never call a private repository or client project "owner approved" unless `disclosure.basis` is `owner-documented` with a `documentedAt` date. Never invent testimonials, revenue, customer counts or metrics. Every project states its maturity honestly: production, beta, prototype or concept.
- **Privacy:** private source and client details stay out of the repo, including names in filenames, comments and tests. `npm run guard:names` enforces this from salted hashes; add a name with `npx tsx scripts/guard-private-names.ts --add <name>`.
- **Secrets:** never commit tokens or keys, and never expose one to the browser. `npm run guard:secrets` scans tracked files.
- **Keep what works:** do not delete or flatten existing features, projects, skins, lab demos, studio, sync or the contact flow. Changes there need an explicit owner request. `tests/guardrails.test.ts` fails if they disappear.
- **Contact:** keep the Resend flow, the direct-email fallback and honest failure messages. The visitor confirmation email must never echo what the visitor typed.
- **Verify before pushing:** run `npm run verify`, then a production build and `npm run leak-check`.

See `docs/GUARDRAILS.md` for how each rule is enforced.
