import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

const read = (f: string) => fs.readFileSync(f, "utf8");

// The approved redesign (docs/redesign/spec.md): three identities that are different compositions, not token swaps,
// and one simple contact flow. These checks stop the work from quietly sliding back into a single shared layout or
// into the old scattered contact UI.

/** Every rule block in identities.css that targets one identity. */
function rulesFor(skin: string) {
  const css = read("app/identities.css");
  return css.split("\n").filter((l) => l.includes(`html[data-skin="${skin}"]`)).join("\n");
}

test("each identity has its own navigation geometry, hero composition and material", () => {
  const sw = rulesFor("open-case"), mc = rulesFor("rogue-instrument"), px = rulesFor("unauthorized-manual");
  // Navigation: a docked left rail, a floating capsule with a liquid indicator, a floating right glass rail.
  assert.match(sw, /\.site-header \{ position:fixed; inset:0 auto 0 0; width:var\(--rail-w\)/);
  assert.match(mc, /\.nav-bar \{[^}]*border-radius:999px/);
  assert.match(mc, /\.nav-liquid \{ display:block/);
  assert.match(px, /\.site-header \{ position:fixed; z-index:50; top:20px; right:20px/);
  // Hero: 7/5 split, 70/30 poster with a liquid form, three overlapping planes.
  assert.match(sw, /\.home-hero\.j-hero \{ grid-template-columns:minmax\(0,7fr\) minmax\(0,5fr\)/);
  assert.match(mc, /\.home-hero\.j-hero \{[^}]*grid-template-columns:repeat\(10,/);
  assert.match(mc, /\.hero-liquid \{ display:block/);
  assert.match(px, /\.hero-backplane \{ display:block; position:absolute/);
  assert.match(px, /\.hero-statement \{ grid-column:1 \/ span 7/);
  assert.match(px, /\.hero-work \{ grid-column:7 \/ -1/, "the middle plane overlaps the front plane");
  // Materials: neumorphic raise and inset, chrome gradients, glass with backdrop blur.
  assert.match(sw, /--sw-raise:12px 12px 26px var\(--j-shadow\), -12px -12px 26px var\(--j-light\)/);
  assert.match(sw, /\.j-inset/);
  const all = read("app/identities.css");
  assert.match(all, /--mc-chrome:linear-gradient\(115deg/);
  assert.match(all, /--px-glass:linear-gradient\(140deg/);
  assert.match(px, /backdrop-filter:blur\(24px\) saturate\(140%\)/);
  assert.match(px, /\.j-scene \{ perspective:1200px; transform-style:preserve-3d; \}/);
});

test("identity rules use tokens only: no raw colours in identities.css", () => {
  const css = read("app/identities.css").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "hex colours belong in app/tokens.css");
  assert.doesNotMatch(css, /rgba?\(/, "rgb() colours belong in app/tokens.css");
});

test("motion and accessibility fallbacks exist for every identity", () => {
  const css = read("app/identities.css");
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /@media \(forced-colors:active\)/);
  assert.match(css, /@supports not \(\(backdrop-filter:blur\(1px\)\)/);
  assert.match(css, /html\[data-kind="identity"\] :focus-visible \{ outline:3px solid/);
  const drift = read("components/DepthDrift.tsx");
  assert.match(drift, /pointer: fine/); assert.match(drift, /prefers-reduced-motion: reduce/);
  assert.match(drift, /Math\.max\(-1, Math\.min\(1/, "drift is bounded");
  assert.match(css, /calc\(var\(--drift-x\) \* -12px\)/, "decorative planes move at most 12px");
});

test("one contact flow: /connect with the approved copy, two shortcuts and a three-field form", () => {
  const page = read("app/connect/page.tsx");
  assert.match(page, /Say hello\./);
  assert.match(page, /Have an idea, a question, or just want to connect\? My inbox is open\./);
  assert.match(page, /<ContactActions variant="page" \/>/);
  const actions = read("components/ContactActions.tsx");
  assert.match(actions, /Email me/); assert.match(actions, /Copy email/); assert.match(actions, /Email copied\./);
  assert.match(actions, /role="status" aria-live="polite"/);
  assert.match(actions, /export function ContactRail/);
  const form = read("components/ConnectForm.tsx");
  for (const s of ["Your message", "Your email", "Add your name", "(optional)", "Send message", "Message sent. Thanks for reaching out.", "Couldn&apos;t send your message.", "email me directly"]) assert.ok(form.includes(s), `form copy: ${s}`);
  assert.match(form, /aria-expanded=\{showName\}/, "the optional name is a real disclosure");
  assert.match(form, /maxLength=\{CONTACT_LIMITS\.nameMax\}/);
  for (const gone of ["intent", "budget", "timeline", "service", "<select", "type=\"radio\""]) assert.ok(!form.includes(gone), `no ${gone} in the form`);
  assert.match(form, /setStatus\("ok"\)/); assert.ok(form.indexOf('setStatus("ok")') > form.indexOf("result.ok"), "success only after the server confirms");
});

test("the scattered contact UI is gone: no Five ways grid, no contact band, no floating pill", () => {
  const home = read("app/page.tsx");
  assert.doesNotMatch(home, /Five ways to start|qc-band|j-ways/);
  assert.ok(!fs.existsSync("components/QuickContact.tsx"));
  assert.doesNotMatch(read("app/layout.tsx"), /QuickContact/);
  // Every contact link opens the same page, with no intent pre-selection.
  const files = ["app/page.tsx", "app/services/page.tsx", "app/learn/page.tsx", "app/projects/[slug]/page.tsx", "app/now/page.tsx", "components/Header.tsx", "components/Footer.tsx"];
  for (const f of files) assert.doesNotMatch(read(f), /\/connect\?/, `${f} links to a /connect variant`);
});

test("classic skins keep their own hero and get none of the identity-only layers", () => {
  const css = read("app/identities.css");
  assert.match(css, /html\[data-kind="classic"\] :is\(\.hero-work, \.hero-backplane, \.hero-liquid, \.hero-atmos\) \{ display:none; \}/);
  assert.match(css, /html\[data-kind="classic"\] :is\(\.hero-statement, \.nav-contact\) \{ display:contents; \}/);
  assert.match(read("app/page.tsx"), /<HomeShowcase projects=\{showcase\} \/>/);
});
