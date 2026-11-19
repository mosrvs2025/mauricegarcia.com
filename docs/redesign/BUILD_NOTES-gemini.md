# Identity System V2 — Build Notes (Gemini)

Implementation of `docs/redesign/spec.md` on `mauricegarcia.com` (Next.js App Router).

## Summary of Architecture

- **One semantic component tree**, restyled via `<html data-skin="…" data-kind="identity|classic">`.
- **Existing skin IDs preserved in place** (`open-case`, `rogue-instrument`, `unauthorized-manual`) so all shareable `?skin=` links, `localStorage["mg-skin"]`, `Alt+Shift+S`, and Workshop-only legacy routes continue working without breakage.
- **All seven classic skins retained** (`workshop`, `paper`, `terminal`, `pop`, `glass`, `swiss`, `arcade`) under **More skins**, with classic `box-shadow: var(--j-shadow)` rules scoped to `html[data-kind="classic"]` so they never collide with V2 color tokens.
- **Reusable material primitives** (`.j-surface`, `.j-inset`, `.j-pressable`, `.j-scene`) added and scoped per identity in `app/identities.css`.
- **Zero raw hex literals in `app/identities.css`**: every color resolves through `--j-*` tokens defined in `app/tokens.css`.
- **Font loading discipline (`app/layout.tsx`)**: Only the default identity (`open-case` / Softworks: `Manrope` 700/800 + `DM Sans` 400/600) is preloaded. `Syne`, `Space Grotesk`, `Outfit`, `IBM Plex Sans`, `Fraunces`, and `Instrument Sans` are all configured with `preload: false` and warmed on demand when switching skins.

---

## Changes Per Identity

### Identity A — SOFTWORKS (`open-case`, default)
- **Design system**: Architectural neumorphism (matte ceramic `#E8EEF2`, deep slate ink `#1B2B3A`, muted `#4C6070`, ocean accent `#155E8A`, soft shadow `#B6C6D1`, highlight `#FFFFFF`, soft accent `#D0E4F1`, `28px` radius).
- **Typography**: `Manrope` 700/800 (`-0.055em` tracking) + `DM Sans` 400/600 (`1.65` line-height).
- **Navigation**:
  - Desktop (`>= 1024px`): Fixed `244px` left vertical ceramic instrument rail with raised icon-label controls (inline SVGs), inward-pressed active state (`.j-inset` + solid accent icon fill), embedded identity switcher, and bottom raised Email/Copy split control + Say hello CTA. Playground dock shifts right (`left: 260px`) so it never overlaps the rail.
  - Mobile / tablet (`< 1024px`): Rounded raised top ceramic dock with single-line `Say hello` and `Menu`.
- **Hero & Layout**:
  - Desktop 7/5 split (`minmax(0, 7fr) minmax(0, 5fr)`) with `96px` section spacing.
  - Left column: engraved meta channel, oversized Manrope statement, intro copy, one raised primary CTA, and curiosity links.
  - Right column: asymmetrical vertical stack of three raised ceramic project modules (`Ultron`, central featured larger `REALMBREAK`, `Ultimate+`) with screenshots inside recessed `.j-inset` frames and zero rotated text.
  - Mobile: single column with horizontally scrollable snap rail for the project modules.
  - Section labels appear engraved into shallow `.j-inset` channels; case files, World Doors, and `/projects` cards render as raised ceramic tiles with recessed screenshot wells.
- **Motion signature (Tactile Response)**: Hover `translateY(-2px)` over `180ms`, `:active` press `translateY(2px)` with inverted inset shadow over `120ms`, reveals opacity + `8px` travel over `320ms`, `cubic-bezier(.2,.8,.2,1)`.

### Identity B — MERCURY (`rogue-instrument`)
- **Design system**: Liquid chrome / glossy dark enamel (`#090D15` bg, `#172233` surface, `#F8FAFF` ink, `#B8C6D6` muted, `#72E4FF` cyan accent, `#FF5C9B` hot specular, `20px` radius).
- **Typography**: `Syne` 700/800 (`-0.065em` tracking) + `Space Grotesk` 400/500/600.
- **Navigation**: Floating horizontal liquid-chrome capsule at the top (`border-radius: 999px`) with specular rim, liquid-pill active indicator, compact identity picker, and dark-enamel Email/Copy split hardware switch.
- **Hero & Layout**:
  - Full-bleed dramatic 70/30 composition: massive left-aligned `Syne` headline (solid `#F8FAFF` base text with decorative chrome gradient on `<em>`) paired with a pure-CSS layered liquid-metal sculpture (`.hero-chrome-sculpture`, `aria-hidden="true"`, zero WebGL/extra image assets).
  - Intro copy and primary metallic CTA live directly below the headline.
  - Below that, `.home-showcase` spans full container width as a cinematic widescreen metallic product showcase (wide media pane + dark enamel metadata/selector rail).
  - Mobile: typography-first poster with the decorative metal form tucked behind a dimmed, contrast-safe region.
  - Sections separated by thin reflective chrome horizon rules; World Doors form an asymmetric editorial grid (door 1 full-width horizontal split; doors 2 & 3 asymmetric `1.25fr / 1fr`); `/projects` uses cinematic 2-column wide cards with edge-lit borders, narrow masked hover specular sweep, and image scale capped at `1.025`.
- **Motion signature (Fluid Momentum)**: Entrance reveals `540ms` staggered, specular sweeps `380ms`, `cubic-bezier(.16,1,.3,1)`, subtle entrance transition on the hero chrome form.

### Identity C — PARALLAX (`unauthorized-manual`)
- **Design system**: Spatial glass architecture (`#0B1423` bg, `#142A3C` surface, `#F8FBFF` ink, `#D0DEE9` muted, `#9EF3DC` mint accent, `#43599C` ambient, `#2CB4B1` glow, `24px` radius), visually distinct from classic Glass Aurora.
- **Typography**: `Outfit` 600/700 (`-0.045em` tracking) + `IBM Plex Sans` 400/500/600.
- **Navigation**: Slim floating frosted glass rail (`58px` height, `18px` radius) with optical rim highlight, bright internal active dot + border indicator, compact identity picker, and translucent floating Email/Copy split control. Mobile uses a compact frosted top bar.
- **Hero & Layout**:
  - `.j-scene` perspective stage (`1200px`) with three overlapping depth planes on a 12-column grid (unlocked via `display: contents` on `.home-showcase` on desktop while preserving logical DOM tab order):
    - **Back plane**: large dimmed featured-project visual (`grid-column: 5 / -1`).
    - **Middle plane**: offset frosted glass project info + selector panel (`grid-column: 7 / -1`, non-obscured).
    - **Front plane**: dominant `Outfit` headline, intro copy, and CTA on a readable translucent glass plane (`grid-column: 1 / span 6`), overlapping the left edge of the back plane.
  - `components/SpatialStage.tsx` drives subtle transform-only `--px`/`--py` pointer parallax (capped at `±12px`) strictly for `(pointer: fine)` devices when reduced motion is off and `unauthorized-manual` is active; disabled on touch and reduced motion.
  - Mobile flattens perspective and stacks planes in clean non-overlapping order.
  - Work & Case Files use staggered bento elevations with layered sharp image planes and elevated frosted metadata planes with displaced optical edge highlights; `/connect` uses a stable, non-moving, opaque-backed glass panel.
  - Includes `@supports not (backdrop-filter: blur(1px))` solid-surface fallbacks.
- **Motion signature (Spatial Drift)**: `560ms` opacity + `scale(0.98 -> 1)` reveals, transform-only pointer drift `<= 12px`.

---

## Unified Contact Experience (`/connect` & Persistent Controls)

- **Removed**:
  - `components/QuickContact.tsx` (old floating "Let's talk" pill) removed from layout and deleted.
  - Redundant homepage contact band (`.qc-band`) and **"Five ways to start"** grid removed from `app/page.tsx`.
  - All intent radios, service selector, budget, timeline, and project dropdowns removed from `/connect`.
- **Added / Updated**:
  - `app/connect/page.tsx` & `components/ConnectForm.tsx`:
    - Exact heading (`Say hello.`), supporting copy (`Have an idea, a question, or just want to connect? My inbox is open.`), and immediate `Email me` + `Copy email` (announces `"Email copied."` via `aria-live="polite"`) actions.
    - Simplified form with required `Your message` (10–3000 chars), required `Your email`, keyboard-operable `Add your name (optional)` disclosure (max 80 chars), hidden `companyFax` honeypot, and `Send message` submit.
    - Exact success (`Message sent. Thanks for reaching out.`, shown only after server confirmation) and failure (`Couldn't send your message. You can email me directly instead.`) live-region messages with direct `mailto:` fallback and preserved draft inputs.
  - `components/ContactActions.tsx`:
    - Shared `ContactSplitControl` used in desktop sticky navigation and at the top of `/connect`.
    - Shared `MobileContactRail`: compact fixed bottom two-action rail (`Email me` + `Copy email`) respecting `env(safe-area-inset-bottom)` with `>= 44×44px` touch targets, automatically hidden on `/connect` and legacy routes.
  - `components/play/Playground.tsx`: Playground dock hidden on `/connect` so it never overlaps form fields or submit buttons; positioned cleanly above the mobile rail on other mobile routes.
  - Backend (`lib/contact.ts`, `lib/contact-emails.ts`, `app/api/contact/route.ts`): Preserves origin check, payload cap, honeypot, link-count spam check, per-client rate limiting, Resend delivery, fixed sender address, validated `replyTo`, HTML escaping, and visitor confirmation safety (never echoes visitor name or message). Updated validation to require only `message` (10–3000 chars; accepts `body` alias) and `email`, with `name` optional (max 80 chars).

---

## Verification & Testing

1. **Automated suite (`npm run verify`)**:
   - `npm run typecheck` (`tsc --noEmit`): passed.
   - `npm run content:validate`: passed.
   - `scripts/contact.test.cjs`: passed (message + email only, optional name <= 80, min/max message length, honeypot, origin check, missing key, Resend delivery, replyTo, HTML escaping, confirmation safety, provider failure, link flood, rate limit).
   - `tsx --test tests/*.test.ts`: **101 / 101 tests passed**, including WCAG AA `>= 4.5:1` contrast verification across all three V2 palettes (`open-case`, `rogue-instrument`, `unauthorized-manual`), font preload checks, unified `/connect` assertions, zero raw hexes in `app/identities.css`, and all existing portfolio/guardrail/SEO/sync/play tests.
   - `npm run guard:secrets`: passed (0 secrets).
   - `npm run guard:names`: passed (0 private names).
2. **Production build & leak check**:
   - `npm run build`: compiled and statically generated all 126 routes cleanly.
   - `npm run leak-check`: passed (195 terms scanned across `.next/server/app`, `.next/static`, `public`).
3. **Browser & Visual Audit (Headless Chrome against `next start`)**:
   - Captured after-screenshots in `docs/redesign/after-gemini/` across `open-case`, `rogue-instrument`, `unauthorized-manual`, and `workshop` on desktop (`1440×900`) and mobile (`390×844`), plus `/connect` desktop & mobile.
   - Verified **zero console/runtime errors** and **zero horizontal overflow** (`scrollWidth <= innerWidth`) across `1440px`, `390px`, and `320px` viewports.
   - Verified `/connect` hides both the Playground dock and MobileContactRail, and verified the `Add your name (optional)` disclosure toggles `aria-expanded` and reveals the `maxLength=80` input.
   - Visually inspected screenshots and fixed initial polish issues (single-line Mercury chrome capsule nav, Mercury headline/orb clearance, Softworks top-aligned 7/5 hero above the fold, Parallax non-obscuring 3-plane geometry, and single-line mobile `Say hello` button).

---

## Known Gaps / Follow-ups

- **Classic skin desktop nav**: Classic skins (`workshop`, `paper`, `terminal`, `pop`, `glass`, `swiss`, `arcade`) keep their original single `Say hello` button in the desktop header (to preserve their classic layout) while still gaining the fixed two-action Email/Copy rail on mobile and the unified `/connect` page.
- **Secondary pages (`/services`, `/learn`, `/projects/[slug]`, `/now`)**: Some internal links on secondary pages still pass query params like `/connect?intent=paid-work` or `/connect?project=...`; `/connect` ignores query params cleanly and renders the unified form without error. Those links can be simplified to plain `/connect` in a follow-up cleanup if desired.
- **Playwright WebP script (`scripts/capture-identities.cjs`)**: Playwright is not installed in this environment, so after-screenshots were captured as PNGs in `docs/redesign/after-gemini/` using system headless Chrome over CDP rather than running `scripts/capture-identities.cjs`.
- **Live Resend delivery**: End-to-end contact API tests used the mocked Resend transport in `scripts/contact.test.cjs` without touching real credentials or sending real email.
