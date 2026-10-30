# Guardrails

Automated checks that stop careless edits, by any agent or person, from undoing the owner's decisions.

| Rule | Enforced by |
| --- | --- |
| Positioning, custom-quote pricing, featured projects, features not removed | `tests/guardrails.test.ts` |
| Private/draft content absent from public output | `npm run leak-check` (CI, production build) |
| Content schema and disclosure rules | `npm run content:validate` |
| No secrets in tracked files | `npm run guard:secrets` |
| No private repo or client names | `npm run guard:names` (salted hashes in `scripts/private-names.json`) |
| Contact flow and email safety | `scripts/contact.test.cjs` |
| Owner review of every change | `.github/CODEOWNERS` plus branch protection |

Run everything locally with `npm run verify`. CI runs the same checks on every PR.

## Branch protection (owner setting)

GitHub, Settings, Branches, add a rule for `main`:
1. Require a pull request before merging.
2. Require review from Code Owners.
3. Require status check `check` to pass.
4. Block force pushes.

The rules in code cannot stop someone with admin rights from bypassing them, so this setting is the real gate.

## Adding a private name to the guard

```bash
npx tsx scripts/guard-private-names.ts --add "name of private project"
```
