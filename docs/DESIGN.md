# Design system: three switchable identities

The site has one component tree and ten skins. Three of them are first-class **identities** and lead the switcher; seven older skins stay available under "More skins". Everything is driven by CSS variables on `<html data-skin="…" data-kind="identity|classic">`. Nothing is cloned per skin.

| Identity (`data-skin`) | Feel | Fonts (next/font) | Palette | Signature detail |
| --- | --- | --- | --- | --- |
| `open-case` (default) | Investigative editorial meets experimental engineering | Anybody (display, variable width and weight) + Atkinson Hyperlegible Next | paper `#F2F0EA`, ink `#181B1C`, red `#C73723`, blue `#255E79`, lime `#D5F067`, rule `#C8CAC5` | Numbered case files and `CaseAnnotation` notes |
| `rogue-instrument` | A hardware control panel for software that misbehaves | Saira Condensed + IBM Plex Sans | graphite `#0D1214`, porcelain `#E7EAE4`, volt lime `#D6F24D`, orange `#F26D46`, cyan `#5FC4C8` | Focus brackets and measurement labels around real demo media |
| `unauthorized-manual` | A rebellious instruction manual | Archivo Black + Public Sans | parchment `#F6EDE2`, black `#11100F`, cobalt `#174CDB`, coral `#FF6E45`, yellow `#EFD967` | "Try it / Break it / Understand it" |

Older skins: `workshop` (the previous default, shown as "Workshop (classic)"), `paper`, `terminal`, `pop`, `glass`, `swiss`, `arcade`. They keep their own looks and typography.

## Where things live

| File | Job |
| --- | --- |
| `lib/skin.ts` | Skin registry (ids, names, swatches, fonts, theme colours), default, legacy rules, and `SKIN_BOOT_SCRIPT` |
| `lib/skin-client.ts` | `applySkin` (cross-fade via View Transitions, instant under reduced motion), font warm-up, `useSkin` |
| `app/layout.tsx` | next/font setup. Only Anybody and Atkinson are preloaded; every other face is `preload: false`, so it costs nothing until a visitor switches to a skin that uses it |
| `app/globals.css` | Foundation and semantic font tokens `--font-display`, `--font-sans` |
| `app/tokens.css` | `--brand-*` source values, the semantic `--j-*` tokens, and the type scale per identity |
| `app/skins.css` | Switcher UI and the seven older skins' overrides |
| `app/identities.css` | The shared identity system and each identity's signature |
| `components/SkinPicker.tsx` | Header switcher, mobile menu, footer row, Alt+Shift+S, 1 to 3 |
| `components/CaseAnnotation.tsx` | The annotation component |

### How a skin is chosen

`SKIN_BOOT_SCRIPT` runs in `<head>` before first paint and always sets `data-skin` (and `data-kind`), from the shareable `?skin=<id>` link, then the saved choice (`localStorage["mg-skin"]`), then the default. `?skin=default` forgets the saved choice. Legacy routes (`coaching`, `ai-receptionist`, `shop`, `ads`, `studio`, `lab`, `v`) always show `workshop`; on those pages the switcher saves the choice and takes the visitor home to see it. The server also renders `data-skin="open-case"`, so with JavaScript off the site is Open Case.

### Adding or changing a skin

1. Add it to `SITE_SKINS` in `lib/skin.ts` (and to the expected lists in `tests/portfolio.test.ts`, `tests/motion.test.ts` and `tests/guardrails.test.ts`).
2. Define its tokens (`--j-bg`, `--j-surface`, `--j-line`, `--j-line-strong`, `--j-text`, `--j-muted`, `--j-accent`, `--j-accent-ink`, and for identities `--j-link`, `--j-play`, the warn/danger tokens and the type tokens) in `app/tokens.css` or `app/skins.css`.
3. Give it an intro palette in `lib/motion.ts` (`INTRO_CSS`).
4. Add it to `scripts/capture-screenshots.cjs` and run `scripts/capture-identities.cjs` for the before/after set.

## Permanent design rules

1. **Two brand typefaces** in the default identity: Anybody for expressive display type, Atkinson Hyperlegible Next for readable content. Other skins may keep their established typography.
2. **No ambient gradients** by default. Flat colour, contrast, spacing and composition. Real project imagery and purposeful effects (the black-hole intro, the Playground) stay.
3. **No generic card grids for featured work.** Large visuals, documentary captions, numbered case files and honest maturity labels.
4. **Colour has a job.** Red is brand emphasis, blue is a functional link or selected state, lime is playful or experimental. No rainbow gradient statistics.
5. **Motion reveals, demonstrates or responds.** Nothing animates merely for entering the viewport.
6. **Every annotation says something true.** No fake telemetry, fabricated metrics, implied endorsements or invented evidence. A `CaseAnnotation` must state its `source` (the project's own content file or README) and must not present unverified information as verified.
7. **One dominant action per screen.** Secondary paths stay discoverable.
8. **Keep the weird stuff weird.** The Playground, black hole, alternate skins and games keep their surprises; do not flatten them into the editorial look.
9. **Accessibility is part of the visual system.** Contrast of 4.5:1 for text and 3:1 for large text and UI graphics, visible keyboard focus (3px, `--j-link`), responsive type, tap support (44px targets), and a plain, non-animated equivalent under `prefers-reduced-motion`.
10. **Judge identity, not just polish.** With the name and screenshots removed, the layout, type and visual language should still be recognisably this site.

Tokens only: components and stylesheets use the semantic `--j-*` tokens, never a raw colour. Never invent a second set of overrides for the same thing; extend the token or the shared rule.

## Screenshots

`node scripts/capture-identities.cjs` writes the homepage, a project page and a writing page at 1440×900 and 390×844 (reduced motion, `?intro=0`, stable data). The committed set is in `docs/screenshots/identity/{before,open-case,rogue-instrument,unauthorized-manual}`; `before` is the Workshop look prior to this change.
