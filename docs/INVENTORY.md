# Project inventory (public repositories only)

Compiled 2026-10-29 from the GitHub connection and shallow clones of public repositories. This is an inventory and positioning review, **not a functional audit**. Private repositories are deliberately not named here because this repository is public; they were counted (63 private of 100 visible) and are excluded from every public surface by default.

"Verified" below means exactly what is stated in the Evidence column. READMEs are promises, not proof.

## Featured on the site

| Project | Repo (branch) | Purpose and audience | Current state | Evidence | Public demo |
| --- | --- | --- | --- | --- | --- |
| Pipeline CRM | private | CRM for a trade shop; one client | **In use per the existing site.** Which version is live, and whether the separate 2.0 rebuild with mock adapters is deployed, is **unconfirmed** | Copy reused from the earlier public Work page; production URL answers with an HTTP 307 (likely a login redirect) | none, by design |
| Lumen | `mosrvs2025/excalidraw` (`claude/peaceful-darwin-rzjbgm`) | AI-native canvas on Excalidraw (MIT); sketchers, tool builders | Prototype; README describes a long feature list | README read; **not run**. Upstream attributed. Default branch is not `main`. Claude co-author trailers | none found (runs with `npm run dev`) |
| Gridheart | `mosrvs2025/gridheart` (`main`) | Godot 4.3 action roguelite where health is a shape | Playable slice | Hosted build returns 200 and renders (2026-10-29); screenshot from the repo's `docs/`; Claude co-author trailers | https://mosrvs2025.github.io/gridheart/ |
| Reality Research | `mosrvs2025/reality-research` (`main`) | Instruments for testing attention/randomness; skeptics and the curious | Prototype; hosted app loads | Hosted app 200 and screenshot captured; accounts/groups depend on an unchecked Supabase backend; Claude co-author trailers | https://mosrvs2025.github.io/reality-research/ |
| Swirl Room | `mosrvs2025/oddlysatisfying` (`main`) | Eight browser toys + Terrarium simulator | Playable slice | Hosted page 200 and screenshot captured | https://mosrvs2025.github.io/oddlysatisfying/ |
| Exit Pass | `mosrvs2025/checkout` (`ccr-a6a79977-kah5nk`) | Phone-first grocery checkout concept | **Simulation**: POS, payments, cart sensors, store traffic are simulated (README says so) | README + SECURITY.md read; e2e tests described, **not run**; Claude co-author trailers | none found |

## Archive on the site

| Project | Repo | State and evidence |
| --- | --- | --- |
| Gem Studio | `mosrvs2025/gems` | Local static tool; screenshot from a local run. README's hosted link returned **404**, so none is linked. |
| OBSERVED | `mosrvs2025/observed` (`claude/jolly-volta-hphyyi`) | README only; not run. Seeded data is labelled simulated by the project itself. |

## Added in the second pass (all public; archive tier unless noted)

Demos below were confirmed to load on 2026-10-29. Hosted URLs were only linked when the repo's own README links them or they are on the owner's GitHub Pages. Several guessed `*.vercel.app` names (`embervale`, `echobound`, `chairgame`, `buzzwords`) answered with **someone else's site** and are deliberately not linked.

| Project | Repo | Demo | Notes |
| --- | --- | --- | --- |
| Mosslight (featured) | `mosslight` | yes (Vercel + Pages) | Title screen captured; journey not played |
| Evolveborn | `evolveborn` | yes (Vercel + Pages) | Godot; menu captured |
| Echobound | `echobound` | yes (Pages) | Godot; menu captured; Claude trailer |
| Echofield | `Echofield` | yes (Vercel, README-linked) | Title captured |
| Rift Runner | `rift-runner` | yes (Pages) | README calls it a starter with one small loop |
| Lineage | `lineage-rts` | yes (Vercel; title and tagline match the README) | Hosted menu is ahead of the README's "first slice" |
| Thornwild | `donkeykong` | no (README link 404s) | Title art from the repo |
| Roomspace | `mixedreality` | yes (Pages; XR parts untested) | Needs a Quest |
| StoreOS | `storeOSant` | yes (Vercel, README-linked) | Demo store is fictional |
| Buzzwords, ShatterOS, Ultimate, PocketPilot, Voxelia, Realms, SIT ON ME, Embervale (game), Resonate Gem Brain, LoFi Typing | various | none verified | README only; not run |

## Public repositories deliberately left off

`dk64`, `dk64-mod-lab` (Donkey Kong 64 fan tooling: Nintendo IP, owner's call), `video` (no README), `sanboxgame` (empty), `Visionai` and `CCC` (AI Studio starters), `AuraSphere` (README only, unverified), `learn-astro-bolt`, `learn-remotion-bolt`, `Blitz-imageai` (tutorials and starters), `mosrvs2025` (profile README).

## Upstream work, never presented as achievements

`openpilot`, `gods-eye-view` and `rea` are forks. Their products, popularity and metrics are not claimed. Only verified contributions could be described, and none are.

## Known gaps

- GitHub access here was read-only for public repositories; private READMEs, commits and PRs were not opened, so private claims (THRIFTSCOUT's pilot, StoreOS, StoryBoard, etc.) are neither verified nor published.
- Location: the profile README says Salt Lake City, the old site said California. Omitted site-wide.
- Existing portraits are reused as supplied; I couldn't verify who took them or their rights.
