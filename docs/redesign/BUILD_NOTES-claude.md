# Build notes: three identities + simple contact (Claude)

Implements `docs/redesign/spec.md`. Before screenshots: `docs/redesign/before/`. After screenshots (same names, WebP): `docs/redesign/after/`, captured from a production build with `node scripts/capture-redesign.cjs`.

## What changed

### Three compositions, not three palettes

Composition was built first, then material. The skin ids are unchanged (`open-case`, `rogue-instrument`, `unauthorized-manual`), so existing `?skin=` links and saved `mg-skin` choices keep working. Only the display names changed.

| | SOFTWORKS (`open-case`, default) | MERCURY (`rogue-instrument`) | PARALLAX (`unauthorized-manual`) |
| --- | --- | --- | --- |
| Navigation, wide screens | Docked vertical rail on the left; raised icon-label tiles; the current page is pressed in | Floating chrome capsule; a liquid indicator slides to the hovered/focused link and rests on the current page | Slim floating glass rail on the right; a bright internal bar marks the current page |
| Navigation, tablet/phone | Rounded raised top dock | Compact capsule | Compact frosted top bar |
| Hero | 7/5 split: statement + one raised CTA left; three raised modules right (featured one larger, the others stepped left and right, lower in depth) | Full-bleed 70/30 poster: massive headline, chrome fill on the emphasised words only, a CSS liquid-metal form, intro below | Stage of three overlapping planes: dimmed featured visual (back), frosted Selected work panel (middle), headline on a translucent surface (front) |
| Selected work | Modules beside the headline; a sideways snap rail on phones | Near full-width chrome showcase, then two items in an asymmetric grid with alternating image/text | Rows on the frosted middle plane (no images, so none are downloaded) |
| Rest of the page | 96px rhythm, labels in inset channels, raised cards, screenshots in recessed frames | Reflective horizon rules, chrome cards with a one-shot specular sweep, alternating case-file directions | Staggered bento (Three worlds, Behind the work), project cards with a separate frosted metadata plane |
| Contact control | One soft-raised pill; each action presses into an inset | Dark enamel split switch: Email is the lit half, Copy the dark half | Translucent split control with a bright Email and an outlined Copy |
| Motion | Hover -2px/180ms, press +2px/120ms, reveals 8px/320ms | 380ms sweeps and indicator, 560–620ms staggered reveals, one entrance morph on the liquid form | Far-to-near scale reveals, pointer drift up to 12px on fine pointers only |
| Fonts (next/font) | Manrope 700/800 + DM Sans 400/600 (preloaded) | Syne 700/800 + Space Grotesk 400/500 (`preload: false`) | Outfit 600/700 + IBM Plex Sans 400/500 (`preload: false`) |

Material primitives `.j-surface`, `.j-inset`, `.j-pressable` and `.j-scene` have a recipe per identity in `app/identities.css` (taken from the spec) and do nothing in the classic skins. All colours are `--j-*` tokens; hex values live only in `app/tokens.css` (`tests/redesign.test.ts` fails on a raw colour in `identities.css`). The grayscale side-by-sides in `docs/redesign/after/grayscale-identities-*.webp` show the three remain distinct with colour removed.

New components: `HeroWork` (the three lead projects as one list, arranged per identity), `DepthDrift` (PARALLAX pointer drift), `ContactActions` / `ContactRail`. Decorative layers (`.hero-liquid`, `.hero-backplane`, `.hero-atmos`, `.nav-liquid`) are `aria-hidden`, take no pointer input and are hidden in forced-colours mode.

### One contact flow

- `/connect`: "Say hello.", the spec's supporting line, **Email me** (mailto) and **Copy email** (announces "Email copied." in a polite live region; the button label also changes). The form shows immediately: Your message (required, 10–3,000), Your email (required, validated), and an "Add your name (optional)" disclosure revealing one name field (max 80). Submit: "Send message". Success: "Message sent. Thanks for reaching out." (only after the server returns `ok`). Failure: "Couldn't send your message. You can email me directly instead." with a mailto that carries the message; the message stays in the form, and the server's own reason (rate limit, unavailable) is shown below it.
- No intent radios, service selector, budget, timeline or project dropdown.
- Removed: the "Five ways to start" grid, the homepage contact band and the floating "Let's talk" pill (`components/QuickContact.tsx` and its CSS).
- Always in reach: wide screens have Say hello + Email/Copy in the navigation; phones get a fixed Email/Copy rail above `env(safe-area-inset-bottom)` with matching bottom padding. The rail and the Playground dock are not rendered on `/connect`; elsewhere on phones the Playground pill rides above the rail.
- Every contact link on the site now points to plain `/connect`. Older links with `?intent=`, `?service=` or `?project=` still open the same page; the parameters are ignored.

### Backend

`lib/contact.ts` now accepts `message` (or the older `body` key), `email`, optional `name` and the `companyFax` honeypot; everything else is ignored, nothing else is required. It trims, strips control characters, and rejects line breaks in the name or address. Origin check, 20 KB cap, honeypot, link-flood refusal, per-client rate limit, fixed sender, validated `replyTo`, escaped HTML, the no-echo visitor confirmation and "success only after the provider accepts" are all unchanged. Message bodies are not logged. Owner emails are now titled "Website message from {name or email}".

## Kept

All seven classic skins (they keep the older hero and the `HomeShowcase` reel; identity-only layers are not shown), `?skin=`, `localStorage` `mg-skin`, Alt+Shift+S and 1–3, Workshop on legacy routes, all content, projects, routes, the Playground, black hole intro, Secret Shelf, case annotations, Studio, sync, Learn and the lab demos.

## Content changes (small, worth checking)

- Display names: Open Case → Softworks, Rogue Instrument → Mercury, Unauthorized Manual → Parallax (switcher, footer, `/lab`, README, AGENTS.md, DESIGN.md).
- PARALLAX's hero tag line now reads "Try it / Break it / Understand it" (the phrase the old manual identity used elsewhere) instead of "Unauthorized user manual · Rev. 001", which no longer fit. The three headlines are unchanged.
- The hero's "Let's build something" link now goes to plain `/connect`.

## Tests and checks

- `npm run verify`: passes (typecheck, content validation, contact tests, 105 unit tests, secret and private-name guards).
- `npm run build` and `npm run leak-check`: pass. The build prints 4 "Dynamic filesystem access" tracing warnings from the content loader; I did not touch the loader.
- Updated tests that encoded the old identity spec (fonts, palettes, intro colours, the floating pill) and rewrote `scripts/contact.test.cjs` for the new contract, keeping every security check and adding length, trimming, optional-name and header-injection cases. Added `tests/redesign.test.ts` (distinct geometry per identity, tokens-only CSS, motion and accessibility fallbacks, the contact copy and fields, removal of the old contact UI, classic skins untouched).
- Browser checks with Playwright on the dev and production builds: copy to clipboard and announcement, validation focus order, name disclosure (aria-expanded, focus moves in), real failure path (no email key locally), mocked success path and the exact payload keys, no Playground or rail on `/connect`, `?skin=` + persistence, Alt+Shift+S then 3, Workshop on `/coaching`, MERCURY's indicator resting on the current page, logical Tab order through the SOFTWORKS rail, no console errors, no horizontal scroll at 320px, 390px, 1024px, 1440px and at 200% zoom, forced-colours mode.

## Not done or not verified

- No real email was sent (no Resend key here); delivery is covered by the mocked tests.
- Core Web Vitals were not measured. Expected effects: two preloaded font files at the spec's weights instead of two variable fonts; hero images in PARALLAX and the classic skins' hidden layers are lazy, so inactive layers are not downloaded; MERCURY's metal form is pure CSS.
- Screen-reader testing was by markup review and Playwright only, not with VoiceOver or NVDA.
- The spec asks that the PARALLAX glass be "materially different from Glass Aurora"; I judged that from screenshots (planes, depth, rail, bento versus Glass Aurora's single frosted panels), and the owner should confirm.
