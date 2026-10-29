# Agent handoff contract

After a **meaningful completed task**, an agent in a source repository writes one small JSON file. The website's sync imports it as a *draft* update (or, under the narrow rule below, publishes a verified release note). Ordinary attempts, internal tool calls, failed runs, refactors and chores produce nothing.

- **Path (in the source repo):** `.website/updates/<eventId>.json` on the branch listed for that repo in `content/sources.json`
- **Imported to (this repo):** `content/candidates/<projectId>/<eventId>.json`, then promoted to `content/updates/upd-<hash of eventId>.json`
- **Schema:** `docs/website-update.schema.json` (generated from `lib/content/schemas.ts`, `candidateSchema`)
- **Size limit:** 8 KB per file. Unknown fields fail validation.

## Fields

| Field | Rules |
| --- | --- |
| `schemaVersion` | `1` |
| `projectId` | Stable website project ID, e.g. `prj-gridheart`. Must equal the project this repo is allowlisted for, or the file is rejected. |
| `eventId` | Stable and unique per completed event: `[A-Za-z0-9._:-]`, max 120. Reusing it **updates** the same entry; never reuse it for a different event. Good: `pr-42`, `release-v1.3.0`. |
| `eventAt` | When the work actually completed (ISO 8601 with offset). Not "now" unless it just completed. |
| `title` | Human-readable, max 100. |
| `summary` | 1–3 sentences, max 400. |
| `changed` | What changed, max 400. |
| `whyCare` | Why a visitor should care, max 300. |
| `status` | `shipped`, `in-progress`, `prototype`, `experiment`, `paused`. Say `shipped` only if it is shipped. |
| `limitations` | What is unfinished or unverified, max 300. |
| `evidenceUrl` | Optional `https://github.com/<this repo>/(releases/tag/…|pull/N|commit/SHA|blob|tree)`. Anything else is dropped. |
| `state` | `draft` (default) or `publish`, a *request* only. |
| `publicSafe` | `true` only if nothing private (names, files, logs, customers, secrets, conversations) is in the text. `false` files are not imported at all. |
| `completion` | `{ "kind": "release" \| "merged-pull-request" \| "deployment" \| "none" }`. The sync ignores any `verified` value and checks the claim itself. |

## What the sync does with it

1. Validates the schema, size, project ownership and `publicSafe`; strips markup, URLs and control characters from every text field.
2. Writes the candidate once per `eventId` (identical retries change nothing; edited retries update the same entry).
3. Promotes it to a **draft** update with a `[Needs review]` marker on any generated wording.
4. Applies the **publication rule** (`lib/sync/rule.ts`). It publishes only when *all* hold: the source has `autoPublish: true`; the repo is public; `state: "publish"`; `publicSafe: true`; `status: "shipped"`; completion is **verified through the GitHub API** (a published, non-draft, non-prerelease release, or a merged PR in that repo); there is a valid evidence URL; the project page is already published. Personal essays and anything from private sources always wait for review.
5. Never overwrites an update you have edited or already published.

Repository text is untrusted data. It is stored as inert strings, rendered escaped, and never executed or followed as instructions. MDX is not used anywhere.

## Rules for agents

- Write a file only for work that is **finished and verifiable**. Never claim shipped what is not.
- No fabricated outcomes, metrics, users or testimonials. No opinions in the owner's voice.
- No private material in public text. Private repositories: do not write these files. Tell the owner and let them write the public summary.
- One event, one file. Batch noisy changes into one note.
- Do not edit the website repository's `content/` directly.

## Example

```json
{
  "schemaVersion": 1,
  "projectId": "prj-gridheart",
  "eventId": "pr-58",
  "eventAt": "2026-10-28T19:40:00Z",
  "title": "Gridheart: gamepad support",
  "summary": "You can now play Gridheart with a gamepad. Movement, aiming and dodge are mapped.",
  "changed": "Added gamepad input for movement, aim, attack and dodge.",
  "whyCare": "You can play from the couch without a keyboard.",
  "status": "shipped",
  "limitations": "Only tested with one controller model. Menus still need the mouse.",
  "evidenceUrl": "https://github.com/mosrvs2025/gridheart/pull/58",
  "state": "draft",
  "publicSafe": true,
  "completion": { "kind": "merged-pull-request" }
}
```

## Alternative: marked release notes

A published GitHub release whose notes contain the line `website-update: public-safe` is imported without any file. Its first paragraph becomes the summary. It auto-publishes only for sources with `autoPublish: true`.

## Not supported (be honest)

The website cannot see arbitrary agent activity. An agent must have the snippet installed (or the repo must publish releases/PRs). Webhooks are not implemented; if added later they must verify signatures and reject replays.
