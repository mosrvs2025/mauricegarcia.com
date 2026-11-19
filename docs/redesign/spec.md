# mauricegarcia.com — Identity System V2
(Source: ChatGPT chat https://chatgpt.com/c/6afeb004-cae8-83e8-a622-d05d4bc018ab)

## 0. Non-negotiables
- Keep all existing biographical facts, statistics, project names, descriptions, and legitimate public links unchanged.
- Never expose private repositories or the Discord invitation.
- Preserve one semantic component tree, styled by html[data-skin].
- Preserve ?skin= URL selection, mg-skin localStorage, Alt+Shift+S, and Workshop on legacy routes.
- Retain the existing seven classic skins under More skins.
- Rework the three primary skin IDs in place so existing links remain functional.
- All color usage must resolve through --j-* variables; hex values belong only in token definitions.
- Build actual composition differences using CSS Grid, distinct hero visual slots, and skin-specific layout rules. Do not simply restyle the existing grid.

## 1. Identity A — SOFTWORKS
Skin ID: open-case
Design system: Architectural neumorphism
Concept: An interface that feels like a precision-built physical object. Warm, inviting, soft, restrained, and tactile. Imagine a sophisticated industrial instrument made from matte ceramic.

### Typography (Google Fonts)
- Display: Manrope 700/800, tight tracking -0.055em
- Body: DM Sans 400/600
- Hero: clamp(3.5rem, 8vw, 7.5rem)
- Body line-height: 1.65

### Color tokens
```css
html[data-skin="open-case"] {
  --j-bg: #E8EEF2;
  --j-surface: #E8EEF2;
  --j-ink: #1B2B3A;
  --j-muted: #4C6070;
  --j-accent: #155E8A;
  --j-accent-ink: #FFFFFF;
  --j-light: #FFFFFF;
  --j-shadow: #B6C6D1;
  --j-outline: #849BAA;
  --j-soft-accent: #D0E4F1;
  --j-radius: 28px;
}
```

### Material recipe
```css
html[data-skin="open-case"] .j-surface {
  background: var(--j-surface);
  border-radius: var(--j-radius);
  border: 1px solid var(--j-soft-accent);
  box-shadow:
    12px 12px 26px var(--j-shadow),
    -12px -12px 26px var(--j-light);
}

html[data-skin="open-case"] .j-inset {
  background: var(--j-surface);
  border-radius: 20px;
  box-shadow:
    inset 6px 6px 12px var(--j-shadow),
    inset -6px -6px 12px var(--j-light);
}

html[data-skin="open-case"] .j-pressable:active {
  transform: translateY(2px);
  box-shadow:
    inset 4px 4px 9px var(--j-shadow),
    inset -4px -4px 9px var(--j-light);
}
```

### Layout and hero
- Desktop uses a spacious 7/5 split with 96px section spacing and generous negative space.
- Left: oversized statement typography, introductory text, and one raised primary CTA.
- Right: an asymmetrical arrangement of three raised, stacked project tiles resembling physical instrument modules.
- The central featured module is larger; supporting modules are offset in depth without rotating text.
- Section labels appear engraved into shallow inset channels.
- Mobile becomes one column with a compact, horizontally scrollable project-module rail.
- Navigation: Desktop vertical instrument rail on the left with raised icon-label controls; mobile rounded top dock. Active item appears pressed inward.
- Project cards: Raised rounded tiles; project screenshots sit inside recessed frames. Hover increases elevation slightly. Expanded metadata appears below the image, never underneath decorative layers.
- Contact: A compact soft-raised control containing the email action and copy action, with the pressed state rendered as an inset surface.

### Motion signature: Tactile Response
- Hover: translateY(-2px) over 180ms.
- Press: translateY(2px) and shadow inversion over 120ms.
- Section reveals: opacity + 8px upward travel, 320ms.
- Easing: cubic-bezier(.2,.8,.2,1).
- No floating loops or excessive elastic animation.

## 2. Identity B — MERCURY
Skin ID: rogue-instrument
Design system: Liquid chrome / glossy UI
Concept: A high-performance creative instrument with polished metal, reflective highlights, dark enamel, and fluidity. Bold and slightly rebellious without looking like a gaming dashboard or generic cyberpunk SaaS.

### Typography (Google Fonts)
- Display: Syne 700/800, tracking -0.065em
- Body: Space Grotesk 400/500
- Hero: clamp(4rem, 10vw, 10rem)
- Typography is intentionally compressed, expressive, and editorial.

### Color tokens
```css
html[data-skin="rogue-instrument"] {
  --j-bg: #090D15;
  --j-surface: #172233;
  --j-ink: #F8FAFF;
  --j-muted: #B8C6D6;
  --j-accent: #72E4FF;
  --j-accent-ink: #09121F;
  --j-hot: #FF5C9B;
  --j-light: #FFFFFF;
  --j-shadow: #000000;
  --j-outline: #68819C;
  --j-radius: 20px;
}
```

### Material recipe
```css
html[data-skin="rogue-instrument"] .j-surface {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  border-radius: var(--j-radius);
  background:
    linear-gradient(
      115deg,
      color-mix(in srgb, var(--j-light) 22%, transparent),
      transparent 28%
    ),
    linear-gradient(
      160deg,
      var(--j-surface) 0%,
      color-mix(in srgb, var(--j-accent) 19%, var(--j-surface)) 58%,
      var(--j-bg) 100%
    );
  border: 1px solid
    color-mix(in srgb, var(--j-light) 30%, transparent);
  box-shadow:
    inset 0 1px 0
      color-mix(in srgb, var(--j-light) 45%, transparent),
    inset 0 -2px 6px
      color-mix(in srgb, var(--j-shadow) 40%, transparent),
    0 24px 50px
      color-mix(in srgb, var(--j-shadow) 55%, transparent);
}

html[data-skin="rogue-instrument"] .j-surface::before {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--j-light) 24%, transparent),
    transparent 30%
  );
}

html[data-skin="rogue-instrument"] .j-pressable {
  transition:
    transform 380ms cubic-bezier(.16,1,.3,1),
    box-shadow 380ms cubic-bezier(.16,1,.3,1);
}
```
Use a narrow, masked specular sweep on hover over prominent surfaces only. Decorative chrome text may use background clipping, but essential headings remain readable solid text.

### Layout and hero
- Full-bleed, cinematic hero with a dramatic 70/30 composition.
- Massive left-aligned headline, with selected letters optionally receiving chrome treatment.
- Right: a large abstract liquid-metal form, rendered using lightweight CSS gradients or a small optimized asset.
- Introductory text lives below the headline, not in a conventional two-column SaaS block.
- Featured project spans nearly the full viewport width like a metallic product showcase.
- Remaining projects form an asymmetric editorial grid with alternating image/text directions.
- Section boundaries use thin reflective horizon rules rather than ordinary dividers.
- On mobile, the hero becomes a typography-first poster; decorative metal form moves behind an isolated, contrast-safe region.
- Navigation: Floating horizontal chrome capsule with a moving liquid active indicator, compact identity selector, and persistent contact access.
- Project cards: Cinematic wide cards, edge-lit borders, reflective corners, high-contrast project imagery. Hover shifts the highlight position and image scale by no more than 1.025. No full-card 3D spinning.
- Contact: Polished, dark enamel split action resembling a small high-end hardware switch. Email and copy remain visually distinct.

### Motion signature: Fluid Momentum
- Section entrances: 480–650ms with staggered children.
- Interactive highlights: 380ms directional sweeps.
- Easing: cubic-bezier(.16,1,.3,1).
- A subtle liquid form transition occurs on hero entrance.
- No perpetual bouncing, aggressive glow pulses, or unnecessary WebGL.

## 3. Identity C — PARALLAX
Skin ID: unauthorized-manual
Design system: Spatial glass architecture
Concept: The interface is a navigable space rather than a flat website. Layered translucent planes, atmospheric depth, optical edge highlights, and restrained perspective motion.
This must look materially different from the existing Glass Aurora skin.

### Typography (Google Fonts)
- Display: Outfit 600/700, tracking -0.045em
- Body: IBM Plex Sans 400/500
- Hero: clamp(3.5rem, 7vw, 7rem)
- Medium-large editorial text with substantial breathing room.

### Color tokens
```css
html[data-skin="unauthorized-manual"] {
  --j-bg: #0B1423;
  --j-surface: #142A3C;
  --j-ink: #F8FBFF;
  --j-muted: #D0DEE9;
  --j-accent: #9EF3DC;
  --j-accent-ink: #09211C;
  --j-ambient: #43599C;
  --j-glow: #2CB4B1;
  --j-light: #FFFFFF;
  --j-shadow: #000000;
  --j-outline: #A8D7E3;
  --j-radius: 24px;
}
```

### Material recipe
```css
html[data-skin="unauthorized-manual"] .j-scene {
  perspective: 1200px;
  transform-style: preserve-3d;
}

html[data-skin="unauthorized-manual"] .j-surface {
  position: relative;
  isolation: isolate;
  border-radius: var(--j-radius);
  background: linear-gradient(
    140deg,
    color-mix(in srgb, var(--j-light) 18%, transparent),
    color-mix(in srgb, var(--j-surface) 78%, transparent) 48%,
    color-mix(in srgb, var(--j-glow) 14%, var(--j-surface))
  );
  -webkit-backdrop-filter: blur(24px) saturate(140%);
  backdrop-filter: blur(24px) saturate(140%);
  border: 1px solid
    color-mix(in srgb, var(--j-light) 30%, transparent);
  box-shadow:
    0 20px 60px
      color-mix(in srgb, var(--j-shadow) 32%, transparent),
    inset 0 1px 0
      color-mix(in srgb, var(--j-light) 28%, transparent);
}

html[data-skin="unauthorized-manual"] .j-surface::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--j-light) 15%, transparent),
    transparent 36%,
    color-mix(in srgb, var(--j-accent) 8%, transparent)
  );
}
```
Use a subtle displaced edge highlight to simulate optical refraction. Native CSS blur is not true physical refraction; do not introduce an expensive rendering engine just to fake it. Stack planes with independent transforms, shadow elevations, and foreground/background separation. Never blur the text itself.

### Layout and hero
- Spatial stage with an atmospheric background and three distinct depth planes.
- Back plane: a large, dimmed featured-project visual.
- Middle plane: an offset frosted panel displaying supporting project information.
- Front plane: crisp, dominant headline and introductory text on a readable translucent surface.
- The planes must overlap rather than fill a conventional left/right hero grid.
- Work section becomes a staggered bento arrangement with controlled overlap and varied elevations.
- Scroll reveals progress from far layers to near layers.
- On mobile, flatten most perspective and stack panels in a readable, non-overlapping order.
- Navigation: Slim floating glass rail on desktop and compact frosted top bar on mobile. Active state uses a bright internal indicator rather than a color-only distinction.
- Project cards: Layered windows with a sharp image plane, separate frosted metadata plane, and thin optical edges. Hover can reveal a modest depth shift but must not obscure project names or descriptions.
- Contact: A translucent floating split control with bright, clearly labeled actions. On the contact page, the form sits in a stable opaque-backed glass panel, not a moving card.

### Motion signature: Spatial Drift
- Section entrances: 500–650ms, opacity and scale from 0.98 to 1.
- Pointer-fine devices may shift decorative hero planes by up to 12px.
- Depth transitions must use transforms, not layout-affecting top/left updates.
- Disable pointer parallax on touch devices.
- Honor reduced motion by removing depth animation and nonessential transforms.

## 4. One unified contact experience
Route: /connect
Backend: Existing /api/contact using Resend and hello@mauricegarcia.com.

### Exact content
- Heading: Say hello.
- Supporting copy: Have an idea, a question, or just want to connect? My inbox is open.
- Immediate actions:
  - Email me → mailto:hello@mauricegarcia.com
  - Copy email → copies hello@mauricegarcia.com and announces "Email copied."
- Form, shown immediately:
  - Your message — required textarea, 10–3000 characters, autofocus only where appropriate.
  - Your email — required, validated email input.
  - Add your name (optional) — small disclosure that reveals a single optional name field, maximum 80 characters.
  - Submit: Send message
- Success: Message sent. Thanks for reaching out.
- Failure: Couldn't send your message. You can email me directly instead.

No intent radios, service selector, budget, timeline, project dropdown, account creation, or calendar scheduling. Do not add intent chips in v1; the message itself supplies context.

### Always-accessible contact
- Desktop: persistent contact actions integrated into the sticky navigation.
- Mobile: compact fixed two-action rail for Email and Copy, respecting env(safe-area-inset-bottom).
- On /connect, hide the floating rail because those same actions are visible at the top of the page.
- Give mobile pages enough bottom padding that content never sits behind the rail.
- The Playground dock must never overlap form inputs or buttons. On /connect, disable or reposition the Playground dock outside the form region.
- Remove the Five ways to start grid, redundant homepage contact band CTAs, and old floating contact pill.
- Every Contact navigation destination opens the same /connect page; direct mail and copy actions remain shortcuts, not separate flows.

### Backend contract
Preserve honeypot, rate limiting, origin validation, and Resend delivery. Update validation to accept message and email as the only required fields, with name optional. Remove requirements for intent, budget, timeline, or service. Validate and trim on the server, use a fixed sender address, keep the user address as a validated replyTo, escape or safely render untrusted message content, and show success only after server confirmation. Never log full message bodies by default.

## 5. Accessibility and performance acceptance checklist
### Accessibility
- WCAG 2.2 AA target. Minimum 4.5:1 normal text contrast, 3:1 large text and relevant UI boundaries.
- Never use shadow, transparency, highlight, or color alone to communicate state.
- Visible :focus-visible indicators across every identity.
- Keyboard-operable skin picker, contact buttons, navigation, optional-name disclosure, and form.
- Touch targets minimum 44×44px.
- Labels remain visible independently of placeholder text.
- Status/error announcements use appropriate live regions.
- Respect prefers-reduced-motion: reduce and forced-colors: active.
- Decorative planes, highlights, and animated forms are noninteractive and hidden from assistive technology.
- Correct focus order despite visual repositioning; avoid CSS ordering that makes keyboard navigation illogical.
- Test at 320px width and 200% zoom without horizontal scrolling or covered controls.

### Performance
- Target mobile LCP ≤2.5s, CLS ≤0.1, INP ≤200ms at the 75th percentile.
- Use next/font/google, with only necessary font weights and no unnecessary inactive-skin preloads.
- Avoid loading hero image assets for inactive skins.
- Use optimized responsive project imagery and explicit aspect ratios.
- Prefer transform/opacity for animation; avoid layout thrashing.
- Restrict large backdrop blurs to small, bounded surfaces.
- Respect reduced motion and support solid-surface fallbacks for unsupported or expensive backdrop-filter.
- No new animation library unless existing CSS/React primitives demonstrably cannot achieve a required behavior.
- Preserve SSR, metadata, SEO semantics, and existing project URLs.
- No console errors, hydration mismatches, or new layout shifts on skin switching.

## 6. Implementation instructions for Claude Code
1. Inspect app/tokens.css, app/identities.css, app/skins.css, components/SkinPicker.tsx, the shared hero/project components, /connect, and /api/contact. Inspect docs/redesign/before/ before changing layouts.
2. Implement the three designs using the existing skin IDs and --j-* token contract. Preserve all seven classic skins and Workshop-only legacy routes.
3. Refactor the hero and project sections to support skin-specific compositions with shared semantic data. Introduce minimal decorative components only when CSS pseudo-elements are insufficient.
4. Introduce reusable j-surface, j-inset, j-pressable, and j-scene material primitives, scoped to the relevant identities. Do not break classic styles.
5. Replace the fragmented contact system with one /connect flow and shared responsive Email/Copy controls.
6. Preserve API security protections and test validation, copy behavior, email delivery, and error recovery.
7. Test all three identities on desktop and mobile, plus reduced motion, keyboard navigation, theme persistence, and existing URL-based skin sharing.
8. Capture new screenshots corresponding to the before references, and verify that the three themes are recognizably different even in grayscale and with their colors mentally removed.

Definition of done: Three genuinely different interface compositions, one frictionless contact experience, existing content and routing preserved, accessible responsive behavior, and no meaningful performance regression. Do not declare completion based solely on token or typography changes.

One implementation point to emphasize to Claude Code: composition must be developed before surface styling. If the three skins still share the same hero proportions, card arrangement, and navigation geometry, even excellent neumorphism, chrome, and glass effects won't meet the redesign goal.
