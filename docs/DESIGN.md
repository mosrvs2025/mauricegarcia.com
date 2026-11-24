# Design system: three identities, three compositions

The site has one component tree and ten skins. Three of them are first-class **identities** and lead the switcher; seven older skins stay available under "More skins". Everything is driven by `<html data-skin="…" data-kind="identity|classic">`. Nothing is cloned per skin.

The three identities are **different interface compositions, not token swaps**: each has its own navigation geometry, hero arrangement, project layout, material and motion. The approved spec is [`docs/redesign/spec.md`](redesign/spec.md); the before screenshots are in `docs/redesign/before/` and the after set in `docs/redesign/after/`.

| Identity (`data-skin`) | Design system | Fonts (next/font) | Navigation | Hero | Work |
| --- | --- | --- | --- | --- | --- |
| **SOFTWORKS** `open-case` | Architectural neumorphism: one matte ceramic surface lit from the top left | Manrope 700/800 + DM Sans 400/600 | Docked vertical instrument rail (left) with raised icon-label controls; the current page is pressed in. Rounded top dock below 1100px | 7/5 split: statement and one raised CTA left, three raised project modules stacked right (a sideways rail on phones) | Raised tiles, screenshots in recessed frames, labels engraved in inset channels, 96px rhythm |
| **MERCURY** `rogue-instrument` | Liquid chrome / glossy UI on dark enamel | Syne 700/800 + Space Grotesk 400/500 | Floating horizontal chrome capsule with a liquid indicator that slides to the hovered or current link | Full-bleed 70/30 poster: massive headline with chrome emphasis, a CSS liquid-metal form, intro below | Near full-width chrome showcase, then an asymmetric editorial grid with alternating image/text; reflective horizon rules |
| **PARALLAX** `unauthorized-manual` | Spatial glass architecture | Outfit 600/700 + IBM Plex Sans 400/500 | Slim floating glass rail (right) with a bright internal bar on the current page. Frosted top bar below 1100px | A stage of three overlapping depth planes: dimmed featured visual (back), frosted selected-work panel (middle), headline on a translucent surface (front) | Staggered bento with controlled overlap and varied elevation; cards are an image plane plus a separate frosted metadata plane |

The ids are older than the names. They are kept so shared `?skin=` links and saved choices keep working.

Older skins: `workshop` (the default look first-time visitors see, shown as "Workshop (classic)"), `paper`, `terminal`, `pop`, `glass`, `swiss`, `arcade`. They keep their own looks, typography and the older two-column hero with the `HomeShowcase` reel.

## Where things live

| File | Job |
| --- | --- |
| `lib/skin.ts` | Skin registry (ids, names, swatches, fonts, theme colours), default, legacy rules, and `SKIN_BOOT_SCRIPT` |
| `lib/skin-client.ts` | `applySkin` (cross-fade via View Transitions, instant under reduced motion), font warm-up, `useSkin` |
| `app/layout.tsx` | next/font setup. Only Fraunces and Instrument Sans (Workshop, the default) are preloaded; every other face is `preload: false` and only the weights the spec names are requested |
| `app/tokens.css` | `--brand-*` source values and the semantic `--j-*` tokens for each identity (the only place identity colours are written) |
| `app/identities.css` | Material primitives and the three compositions. Sections: shared pieces, shared identity base, SOFTWORKS, MERCURY, PARALLAX, motion and fallbacks |
| `app/skins.css` | Switcher UI and the seven older skins' overrides |
| `components/Header.tsx` | One navigation tree; the identities give it different geometry. Also drives MERCURY's liquid indicator |
| `components/HeroWork.tsx` | The three lead projects as one list, arranged per identity |
| `components/DepthDrift.tsx` | PARALLAX pointer drift (fine pointers only, up to 12px, off under reduced motion) |
| `components/ContactActions.tsx` | Email me / Copy email, used in the navigation, the phone rail and `/connect` |
| `components/ConnectForm.tsx` | The contact form |

### Material primitives

`.j-surface`, `.j-inset`, `.j-pressable` and `.j-scene` are shared class names with a recipe per identity (and no effect in the classic skins). The same recipes are applied to the existing card classes (`.j-panel`, `.j-cap`, `.j-tile-link`, `.wd-link` …) so every page picks up the material.

- SOFTWORKS: `--sw-raise` (12px shade down-right, 12px light up-left), `--sw-inset`, `--sw-press`. Hover lifts 2px over 180ms; press drops 2px and inverts the shadow over 120ms.
- MERCURY: `--mc-chrome` (specular highlight over a surface-to-accent gradient), `--mc-edge`, `--mc-drop`, `--mc-horizon`. A narrow specular sweep crosses prominent surfaces on hover (380ms). Images scale at most 1.025.
- PARALLAX: `--px-glass` with `backdrop-filter: blur(24px) saturate(140%)` on bounded surfaces only, an optical edge highlight on `::before`, and three elevations (`--px-edge-far`, `--px-edge`, `--px-edge-near`). Text is never blurred.

### How a skin is chosen

`SKIN_BOOT_SCRIPT` runs in `<head>` before first paint and always sets `data-skin` (and `data-kind`), from the shareable `?skin=<id>` link, then the saved choice (`localStorage["mg-skin"]`), then the default. `?skin=default` forgets the saved choice. Legacy routes (`coaching`, `ai-receptionist`, `shop`, `ads`, `studio`, `lab`, `v`) always show `workshop`; on those pages the switcher saves the choice and takes the visitor home to see it. Alt+Shift+S opens the switcher; 1 to 3 pick an identity while it is open. The server renders `data-skin="workshop"`, so with JavaScript off the site is Workshop.

### Adding or changing a skin

1. Add it to `SITE_SKINS` in `lib/skin.ts` (and to the expected lists in `tests/portfolio.test.ts`, `tests/motion.test.ts` and `tests/guardrails.test.ts`).
2. Define its tokens in `app/tokens.css` or `app/skins.css`: `--j-bg`, `--j-surface`, `--j-text`, `--j-muted`, `--j-line`, `--j-line-strong`, `--j-accent`, `--j-accent-ink`, `--j-link`, `--j-play`, the status tokens and, for identities, `--j-light`, `--j-shadow` (colours, not shadow values) and the type tokens.
3. Give it an intro palette in `lib/motion.ts` (`INTRO_CSS`).
4. For an identity, build its composition first (navigation geometry, hero slots, work arrangement), then its material. `tests/redesign.test.ts` checks that the three keep distinct geometry.

## Contact

One flow. Every "Say hello" or contact link opens `/connect`: "Say hello.", the two shortcuts (Email me, Copy email), and a form with a required message (10 to 3,000 characters), a required email and an optional name behind a small disclosure. It posts to `/api/contact` (Resend, fixed sender, the visitor only as a validated `replyTo`, honeypot, origin check, link-flood and rate limits, no message bodies in logs). Success is shown only after the server confirms; failure keeps the message and offers a direct email link.

Shortcuts elsewhere: on wide screens the Email/Copy pair sits in the navigation; on phones a fixed two-button rail sits above the safe area, and pages get bottom padding so nothing hides behind it. The rail and the Playground are not shown on `/connect`.

## Permanent design rules

1. **Composition before surface.** If two identities share hero proportions, card arrangement and navigation geometry, the work is not done, however good the materials look.
2. **Tokens only.** Components and stylesheets use the `--j-*` tokens; hex values live in `app/tokens.css` and `app/skins.css`. `tests/redesign.test.ts` fails on a raw colour in `app/identities.css`.
3. **Colour, shadow, transparency and highlight never carry state alone.** Current pages are also bold, underlined, pressed or barred; copied states change their label; errors have text.
4. **Motion reveals, demonstrates or responds.** SOFTWORKS 8px/320ms reveals, MERCURY 480–650ms staggered entrances, PARALLAX far-to-near scale. No loops, bounces or glow pulses. Reduced motion removes depth and nonessential transforms.
5. **Decorative layers are decoration.** The liquid form, back plane, atmosphere and indicators are `aria-hidden`, take no pointer input, and are hidden in forced-colours mode.
6. **Keep the weird stuff weird.** The Playground, black hole, alternate skins and games keep their surprises.
7. **Every annotation says something true.** A `CaseAnnotation` must state its `source` and must not present unverified information as verified.
8. **Accessibility is part of the visual system.** 4.5:1 text, 3:1 large text and component boundaries, a visible 3px `:focus-visible` ring in every identity, 44px targets, logical focus order whatever the visual arrangement, no horizontal scroll at 320px or 200% zoom.

## Floating controls and numerals

- **Floating controls.** The Playground (`.play-dock`) is the only floating control. On phones it rides above the contact rail (`--float-bottom` is lifted while `.cx-rail` is present). `FloatGuard` fades it out while anything marked `data-float-clear` is in the bottom 88px of the screen. To protect new content from being covered, add `data-float-clear` to it.
- **"Stay curious."** has two triggers for one dialog: inline in the hero curiosity row on wide screens, and under the byline at 900px and below.
- **Numerals.** Counters (`.j-num`, `.cf-no`, section numbers) use `--font-num` with `tabular-nums lining-nums`.
- **Contrast.** `tests/polish.test.ts` asserts that link, muted and body text meet 4.5:1 on each identity's background and surface.

## Screenshots

`node scripts/capture-redesign.cjs` (against a running server) writes the redesign's after set to `docs/redesign/after/`, named like the before set, plus grayscale comparisons. `node scripts/capture-identities.cjs` writes the homepage, a project page and a writing page per identity to `docs/screenshots/identity/<id>/`.
