# Owner guide

Everything on the site is a file in this repository. You change the site by changing files, either in the browser studio (from your phone) or in Git.

## What lives where

| What | File | Who writes it |
| --- | --- | --- |
| Projects (curated) | `content/projects/*.json` | You, in Git. Sync never touches these. |
| Short updates | `content/updates/*.json` | You (studio), or a draft the sync/agents created that you then edit |
| Writing | `content/posts/*.md` | You (studio) |
| Now page + home "current focus" | `content/now.json` | You. Git activity never changes it. |
| Which repos may feed updates | `content/sources.json` | You. Anything not listed is excluded. |
| Raw agent/sync notes | `content/candidates/<projectId>/<eventId>.json` | Machines. Never rendered. |
| Last sync result | `content/sync-status.json` | The sync job |

Every file has a schema (`lib/content/schemas.ts`). `npm run content:validate` runs in every build, in CI, and inside the studio before each save.

## States and visibility

- **status**: `draft` (never public), `proposed` (shown only on preview deployments, waiting for your approval), `published`, `archived` (hidden).
- **visibility**: `public` (listed everywhere), `unlisted` (page exists, `noindex`, not in lists, feeds or sitemap), `private` (no page at all).

Three dates are kept apart: **event date** (`eventAt`: when the work happened), **imported-at** (`provenance.importedAt`: when a machine saw it) and **editorial date** (`publishedAt`: when it became public). The site shows the event date on updates.

## Approving the proposed content

Everything I wrote about you or inferred from your repositories is `proposed`. To see it, open the preview deployment (it sets `SITE_PREVIEW=1`). Nothing proposed is visible on production, even if the variable is set there.

```bash
npm run content:approve                      # list what is waiting
npm run content:approve -- --yes --only prj-gridheart,now
npm run content:approve -- --yes             # publish everything proposed
```

Edit the wording first, in the studio or in the files. The Now page records `reviewedBy: owner` and today's date only when you approve it.

## Turn on the studio (`/studio`)

The studio is off until it has real authentication and real storage. Set these in Vercel (Production and Preview), never in the browser:

| Variable | Value |
| --- | --- |
| `STUDIO_PASSPHRASE` | 12+ characters. What you type to sign in. |
| `STUDIO_SESSION_SECRET` | 32+ random characters (`openssl rand -base64 48`). Signs the session cookie. |
| `STUDIO_GITHUB_TOKEN` | Fine-grained personal access token, **this repository only**, **Contents: Read and write**. Add **Actions: Read and write** if you want "Sync now". |

Then visit `/studio/login`. A session lasts 12 hours (HttpOnly, SameSite=Strict cookie). The GitHub token stays on the server.

How editing works: **Save draft** commits the file with `status: draft` (not public). **Full preview** renders it with the real page components. **Publish** commits `status: published`; the site updates on the next deploy (a couple of minutes). **Unpublish** goes back to draft. **Restore this version** (History panel) writes an earlier version as a *new* commit, so history is never rewritten. A stale editor can't overwrite a newer change; it asks you to reload.

If anything is not configured the studio says exactly what is missing and offers no fake editor.

Local development: `STUDIO_STORAGE=fs npm run dev` edits files on disk and commits them with git (refused in production).

## Updates from your repositories

Flow: allowlisted repo → meaningful completed work → validated candidate → publication rule → canonical content → deploy and RSS.

1. Add the repo to `content/sources.json` with its real default **branch** (several are not `main`). Private repos are never read into this public repository.
2. The **Sync project updates** workflow runs every 6 hours and on demand (Actions tab, or "Sync now" in the studio). It reads releases, merged PRs (batched into one note per week), and any `.website/updates/*.json` files agents wrote. Commit digests are available per source but off by default.
3. Everything becomes a **draft update** with a `[Needs review]` marker where wording was generated. The schema refuses to publish text that still has the marker.
4. **The only automatic publication**: a source with `"autoPublish": true`, a public repo, a published release carrying the line `website-update: public-safe` in its notes, verified through the GitHub API, for a project whose page is already published. Everything else waits for you.
5. Retries update the same entry (same event ID) and never create duplicates. Edits you make mark the entry `editedByOwner`, and syncs skip it forever.

If GitHub is down or a token expires, the failing source is recorded in `content/sync-status.json` (shown under Studio → Sync), already-written content is untouched, and the run goes red. Re-run it, or renew `SYNC_READ_TOKEN`. Visitors never trigger a GitHub request.

### Repository secrets
- `SYNC_READ_TOKEN` (optional): fine-grained, **read-only** (Contents, Metadata) on the allowlisted repos. Public repos work without it, but anonymous rate limits are tight.
- The workflow uses the built-in `GITHUB_TOKEN` with `contents: write` only, to commit drafts here.
- If `main` is protected, allow the Actions bot to push drafts, or switch the workflow to open a PR.

## Installing the agent snippet

Agents only report if they've been told to. See `docs/AGENT_SNIPPET.md` (copy into each repo's `AGENTS.md` or `CLAUDE.md`) and `docs/AGENT_HANDOFF.md` (the contract). The site cannot observe agent activity on its own.

## Contact form

`/connect` posts to `/api/contact` (same server-side Resend flow as before: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, mail to `hello@mauricegarcia.com` with the visitor as Reply-To). Missing configuration returns an honest 503 and the form shows a `mailto:` link with the message already filled in. Spam protection: hidden honeypot field, link-flood limit, and a best-effort per-client rate limit (per server instance). Mail DNS and forwarding are untouched. `/contact` redirects to `/connect`, keeping `?service=`.

## Measurement

If Google Analytics is configured (it already was), the site sends only aggregate events: `demo_visit`, `source_click`, `project_to_contact`, `connect_intent`, `connect_submit` (intent and project only, never names, emails or message text), `feed_click`, `post_read`, `surprise_me`. Visitors who send Do Not Track or Global Privacy Control are not measured at all.

## Cutover checklist (needs you)

1. Review the preview deployment; approve or edit proposed content.
2. Resolve the location conflict (California vs Salt Lake City). Location is omitted site-wide until then.
3. Confirm the contact flow on the preview with `RESEND_API_KEY` set (send yourself one).
4. Set the studio variables; sign in and publish a test update, then roll it back.
5. Merge to `main`; Vercel deploys. Redirects: `/contact`→`/connect`, `/work`→`/projects/pipeline-crm`. Do not touch DNS/MX.
