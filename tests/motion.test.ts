import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import { INTRO_BOOT_SCRIPT, INTRO_CSS, INTRO_FAILSAFE_MS, INTRO_KEY, INTRO_SKIN_IDS, animatesTo, trackForUrl } from "../lib/motion";

const u = (s: string) => new URL(s, "https://example.test");
const tracks = { thornwild: "experiences", thriftscout: "products", lumen: "labs" };

test("track colour follows /projects?track= and project pages", () => {
  assert.equal(trackForUrl(u("/projects?track=experiences"), tracks), "experiences");
  assert.equal(trackForUrl(u("/projects?track=products"), tracks), "products");
  assert.equal(trackForUrl(u("/projects?track=labs"), tracks), "labs");
  assert.equal(trackForUrl(u("/projects?track=bogus"), tracks), null);
  assert.equal(trackForUrl(u("/projects"), tracks), null);
  assert.equal(trackForUrl(u("/projects/thornwild"), tracks), "experiences");
  assert.equal(trackForUrl(u("/projects/thornwild/"), tracks), "experiences");
  assert.equal(trackForUrl(u("/projects/unknown"), tracks), null);
  assert.equal(trackForUrl(u("/about"), tracks), null);
});

test("curtain only plays for real same-origin page navigations", () => {
  const here = u("/projects");
  assert.equal(animatesTo(u("/about"), here), true);
  assert.equal(animatesTo(u("/projects?track=labs"), here), true);
  assert.equal(animatesTo(u("/projects#top"), here), false);
  assert.equal(animatesTo(u("https://elsewhere.test/about"), here), false);
  assert.equal(animatesTo(u("/updates/rss.xml"), here), false);
  assert.equal(animatesTo(u("/products/replace-invoice2go.pdf"), here), false);
  assert.equal(animatesTo(u("/studio"), here), false);
  assert.equal(animatesTo(u("/about"), u("/studio")), false);
  assert.equal(animatesTo(u("/api/connect"), here), false);
});

function runIntro(path: string, search: string, opts: { iframe?: boolean; seen?: boolean } = {}) {
  const classes = new Set<string>();
  const store: Record<string, string> = opts.seen ? { [INTRO_KEY]: "1" } : {};
  const sessionStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  };
  const ctx = {
    window: { top: opts.iframe ? {} : undefined },
    location: { pathname: path, search },
    sessionStorage,
    innerWidth: 1440,
    document: {
      documentElement: {
        clientWidth: 1440,
        style: { paddingRight: "" },
        classList: { add: (c: string) => classes.add(c), remove: (...cs: string[]) => { for (const c of cs) classes.delete(c); }, contains: (c: string) => classes.has(c) },
      },
      addEventListener() {},
      removeEventListener() {},
    },
    setTimeout(fn: () => void, ms: number) { return 1; },
    clearTimeout() {},
  };
  // window.top !== window: in the real script, top is window unless iframed. Mirror that.
  ctx.window.top = opts.iframe ? {} : ctx.window;
  vm.runInNewContext(INTRO_BOOT_SCRIPT, ctx);
  return { classes, store };
}

test("intro boot script is valid JS, stays off unless ?intro=1, and has the 8s failsafe", () => {
  assert.doesNotThrow(() => new Function(INTRO_BOOT_SCRIPT));
  assert.equal(INTRO_FAILSAFE_MS, 8000);
  assert.ok(INTRO_BOOT_SCRIPT.includes(`setTimeout(end,${INTRO_FAILSAFE_MS})`));
  assert.ok(INTRO_BOOT_SCRIPT.includes("mg-intro-on"));
  // First visits and ordinary repeat views must not be blocked by the overlay.
  for (const [path, search] of [["/", ""], ["/", "?intro=0"], ["/projects", ""], ["/connect", ""], ["/about", ""]]) {
    const r = runIntro(path, search);
    assert.equal(r.classes.has("mg-intro-on"), false, `${path}${search} must not auto-play the intro`);
  }
  const play = runIntro("/", "?intro=1");
  assert.equal(play.classes.has("mg-intro-on"), true, "?intro=1 still plays the intro");
  assert.equal(play.store[INTRO_KEY], "1");
  assert.equal(runIntro("/studio", "?intro=1").classes.has("mg-intro-on"), false, "/studio never gets the intro");
  assert.equal(runIntro("/", "?intro=1", { iframe: true }).classes.has("mg-intro-on"), false, "iframes never get the intro");
});

test("intro CSS: Workshop boot colours, curtain timing, every skin, reduced motion", () => {
  assert.match(INTRO_CSS, /#12100D/);
  assert.match(INTRO_CSS, /#ff6535/);
  assert.match(INTRO_CSS, /\.72s/);
  // three bands, 0.14s apart
  assert.match(INTRO_CSS, /\.b1\{[^}]*animation-delay:2\.4s/);
  assert.match(INTRO_CSS, /\.b2\{[^}]*animation-delay:2\.54s/);
  assert.match(INTRO_CSS, /\.b3\{[^}]*animation-delay:2\.68s/);
  assert.match(INTRO_CSS, /clip-path:inset\(0 0 100% 0\)/);
  assert.match(INTRO_CSS, /prefers-reduced-motion:reduce/);
  // Black hole: appears, then expands to swallow the screen before the bands lift; hidden under reduced motion.
  assert.match(INTRO_CSS, /mgi-bh-out/);
  assert.match(INTRO_CSS, /mgi-swallow/);
  assert.match(INTRO_CSS, /#ffc857/); // Workshop gold highlight
  assert.match(INTRO_CSS, /\.bh,html\.mg-intro-on #mg-intro \.swallow\{display:none\}/);
  const bh = fs.readFileSync("app/motion.css", "utf8");
  for (const part of ["bh-halo", "bh-ring", "bh-core", "bh-disk", "bh-p", "bh-fall", "bh-spin"]) assert.ok(bh.includes(part), `${part} missing from black hole CSS`);
  assert.match(bh, /#mg-pt \.bh \{ display:none; \}/);
  assert.doesNotMatch(fs.readFileSync("components/PageTransition.tsx", "utf8"), /✳/);
  assert.doesNotMatch(fs.readFileSync("components/IntroOverlay.tsx", "utf8"), /className="star"/);
  assert.match(INTRO_CSS, /html\.mg-intro-on\{overflow:hidden\}/);
  // Bands are painted from the active skin's own variables, never a fixed colour per skin.
  assert.match(INTRO_CSS, /--a:var\(--j-bg/);
  assert.match(INTRO_CSS, /--b:var\(--j-accent/);
  // Every skin the picker offers still has an intro palette: either its own override or the variable-driven default.
  assert.deepEqual([...INTRO_SKIN_IDS].sort(), ["arcade", "glass", "open-case", "paper", "pop", "rogue-instrument", "swiss", "terminal", "unauthorized-manual", "workshop"]);
  // Tokens live in app/tokens.css (Open Case, Rogue Instrument, Unauthorized Manual, Workshop) and app/skins.css (the older skins).
  const skins = fs.readFileSync("app/skins.css", "utf8") + fs.readFileSync("app/tokens.css", "utf8");
  for (const id of INTRO_SKIN_IDS) {
    assert.match(skins, new RegExp(`html\\[data-skin="${id}"\\]\\s*\\{[^}]*--j-bg:`), `${id} must define --j-bg for the intro bands`);
    assert.match(skins, new RegExp(`html\\[data-skin="${id}"\\]\\s*\\{[^}]*--j-accent:`), `${id} must define --j-accent for the intro bands`);
  }
  // The three identities and Workshop each carry their own intro palette; their wordmark takes the identity's display face.
  for (const [id, bg, accent] of [["open-case", "#1B2B3A", "#155E8A"], ["rogue-instrument", "#0D1214", "#D6F24D"], ["unauthorized-manual", "#11100F", "#174CDB"], ["workshop", "#12100D", "#ff6535"]]) {
    assert.match(INTRO_CSS, new RegExp(`html\\[data-skin="${id}"\\] #mg-intro\\{--a:${bg};--b:${accent}`), `${id} intro palette`);
  }
  assert.match(INTRO_CSS, /font-family:var\(--j-font-display,var\(--font-display/);
});

test("intro and curtain are wired into the layout without hiding the hero content", () => {
  const layout = fs.readFileSync("app/layout.tsx", "utf8");
  assert.match(layout, /INTRO_BOOT_SCRIPT/);
  assert.match(layout, /<IntroOverlay \/>/);
  assert.match(layout, /<PageTransition /);
  // The overlay is a sibling layer: the home page markup itself must not be gated on the intro.
  const home = fs.readFileSync("app/page.tsx", "utf8");
  assert.doesNotMatch(home, /mg-intro/);
  assert.match(home, /Play this site as a game/);
  assert.match(fs.readFileSync("components/HomeShowcase.tsx", "utf8"), /Selected work/);
});
