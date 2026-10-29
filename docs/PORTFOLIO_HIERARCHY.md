# Portfolio hierarchy

How projects are chosen, grouped and ordered. This is **editorial judgment**, not a score computed from GitHub. Commit counts, stars and repository size say how much typing happened, not how good or useful something is, so they are not used.

## Three tracks

| Track | What it is | Why it exists |
| --- | --- | --- |
| **Products** | Practical software with a clear user and a business case | Shows commercial value and real-world execution |
| **Experiences** | Games, worlds and interactive pieces, built to be played | Shows range, creative ambition and real-time engineering |
| **Labs** | Experimental technology, AI and creative tools | Shows the "I didn't know that was possible" side |

Each track has its own featured projects on the home page (three each), so neither the practical work nor the experiments bury the other. Both are one click from each other.

## How a project earns its place

Judged on five things, in this order of weight when they conflict:

1. **Technical sophistication and originality.** Is there a hard or novel idea in it?
2. **Actual functionality and usability.** Does it work when a stranger opens it?
3. **Business value and monetization potential.** Could this be a product, a license or a service?
4. **Visual appeal and presentation quality.** Does it look as good as it is?
5. **Real-world adoption and verified results.** Is it used, and is that written down?

Never counted: stars, commit counts, active days, lines of code.

## Maturity labels (shown on every project)

| Label | Meaning | What the site enforces |
| --- | --- | --- |
| **Production** | In real use, with the use documented | Needs `disclosure.basis: owner-documented`. Today only Pipeline CRM. |
| **Beta** | A public demo works today; expect rough edges | Needs `links.demo`. The weekly demo check keeps this honest. |
| **Prototype** | Built and runnable, but not yet shown working publicly | Default for anything without a verified public demo |
| **Concept** | An idea or design, with little or nothing built | |

If a demo breaks, remove `links.demo`; the schema then requires the project to drop from beta. OBSERVED is an example: its hosted copy loads but its API doesn't, so it has no live link and is a prototype.

## The featured set, and why

**Products**
- **Pipeline CRM** (production): the strongest proof of real-world use, a system a real business runs on. High business value. No screenshots, because it is a client's private system.
- **ThriftScout** (beta): a live no-card pilot on its own domain with real accounts; the clearest example of a product with a market. Payments are not live, and the page says so.
- **Ultimate** (prototype): the broadest piece of engineering here, an offline Android toolkit with several tools in one codebase and clear licensing potential. Labelled prototype because it has not been independently built and run for this site; promote it once there's a verified build.

**Experiences**
- **Thornwild**, **Lineage**, **Mosslight**: the most ambitious playable work. All have public demos that load.

**Labs**
- **Lumen**: an AI-native canvas (built on Excalidraw, credited) that shows applied AI. Public demo; works without an API key.
- **Swirl Room**: a polished interactive toy, a different kind of craft.
- **Reality Research**: an experiment in honest instrumentation: tests that show when nothing happened.

Everything else is in the archive but fully visible and searchable under its track.

## Not shown, on purpose

Projects whose source is private appear only when permission is **documented** in the project file (`disclosure.basis: owner-documented` with `documentedAt` and a note). A public demo is not permission to disclose private details. Today that covers Pipeline CRM and ThriftScout. These are hidden as drafts until permission is documented: Cognition OS, Tuck, Breanna's Cleaning & Yard Care (a client), Living Cosmos, Game Fusion, Devolution. Their screenshots and previews are parked in `content-pending/media/` (not served; the leak check also fails if a hidden project's file name appears under `public/`). To show one, move its media back to `public/projects/`, set `disclosure` honestly, check `links.demo`, and set `status: published`.

## Changing it

Edit `track`, `tier` (featured/archive) and `order` in a project's JSON file. `npm run content:validate` checks the rules, and `tests/portfolio.test.ts` fails if the practical products stop being featured, a track loses its featured set, or private work appears without documented permission.
