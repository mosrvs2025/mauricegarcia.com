<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Keep the portfolio current

Preserve the live demos, interactive project presentation, media previews and site styles. When adding a public-repository project, also add its verified repository and branch to `content/sources.json`; the portfolio test checks coverage. Do not infer deployed functionality from commits. After a visitor-visible feature ships, check the matching project's demo link, capabilities, limitations and screenshots/video, following `docs/AGENT_SNIPPET.md`. Private source repositories remain excluded from automated imports.
