import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

const read = (f: string) => fs.readFileSync(f, "utf8");

// Mobile, legibility, unified contact, and V2 identity composition checks.

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

/** The literal token values for one identity (resolving var(--j-*) aliases within the block). */
function tokens(skin: "open-case" | "rogue-instrument" | "unauthorized-manual") {
  const css = read("app/tokens.css");
  const start = skin === "open-case" ? css.indexOf(":root,") : css.indexOf(`html[data-skin="${skin}"] {`);
  const block = css.slice(start, css.indexOf("\n}", start));
  const raw: Record<string, string> = {};
  for (const m of block.matchAll(/(--j-[\w-]+):\s*([^;]+);/g)) raw[m[1]] = m[2].trim();
  const resolve = (name: string, depth = 0): string => {
    assert.ok(raw[name] && depth < 5, `${skin} defines ${name}`);
    const alias = raw[name].match(/^var\((--j-[\w-]+)\)$/);
    return alias ? resolve(alias[1], depth + 1) : raw[name];
  };
  return { bg: resolve("--j-bg"), surface: resolve("--j-surface"), text: resolve("--j-text"), muted: resolve("--j-muted"), link: resolve("--j-link") };
}

test("every identity keeps link and secondary text at WCAG AA (4.5:1) on its background and surface", () => {
  for (const skin of ["open-case", "rogue-instrument", "unauthorized-manual"] as const) {
    const t = tokens(skin);
    for (const [name, fg] of [["link", t.link], ["muted", t.muted], ["text", t.text]] as const) {
      for (const [bgName, bg] of [["bg", t.bg], ["surface", t.surface]] as const) {
        assert.ok(ratio(fg, bg) >= 4.5, `${skin}: ${name} on ${bgName} is ${ratio(fg, bg).toFixed(2)}:1`);
      }
    }
  }
});

test("'Surprise me' and 'Stay curious.' in the identities use the link colour at a readable size, never a dimmed one", () => {
  const css = read("app/identities.css");
  assert.match(css, /\.home-curiosity \.j-surprise button \{ color:var\(--j-link\); font-size:1rem/);
  const journal = read("app/journal.css");
  assert.match(journal, /\.curiosity-hint \{ font-size:\.8rem; \}/);
  assert.doesNotMatch(css, /\.j-surprise[^}]*opacity/);
});

test("counters use one tabular, plain-zero face (--font-num) in the identities", () => {
  const tokensCss = read("app/tokens.css");
  assert.equal((tokensCss.match(/--font-num:/g) || []).length, 3, "one --font-num per identity");
  const css = read("app/identities.css");
  assert.match(css, /:is\(\.j-num, \.cf-no[^)]*\) \{ font-family:var\(--font-num\)[^}]*tabular-nums lining-nums/);
  const showcase = read("components/HomeShowcase.tsx");
  assert.match(showcase, /padStart\(2, "0"\)/);
  assert.doesNotMatch(showcase, /0\{selected/);
});

test("floating controls: safe-area mobile contact rail, Playground starts as a pill and hides on /connect", () => {
  const journal = read("app/journal.css");
  assert.match(journal, /--float-bottom:/);
  assert.match(journal, /\.m-contact-rail/);
  assert.match(journal, /html\[data-float-clear\] \.play-dock:not\(:focus-within\)/);
  const play = read("app/play.css");
  assert.match(play, /var\(--float-bottom/);
  const playground = read("components/play/Playground.tsx");
  assert.match(playground, /saved === null && matchMedia\("\(max-width: 900px\)"\)/);
  assert.match(playground, /path\.startsWith\("\/connect"\)/, "Playground dock must not overlap /connect form");
  const layout = read("app/layout.tsx");
  assert.match(layout, /<FloatGuard \/>/);
  assert.match(layout, /<MobileContactRail /);
  assert.doesNotMatch(layout, /QuickContact/, "old floating contact pill is removed");
  const home = read("app/page.tsx") + read("components/HomeShowcase.tsx");
  assert.ok((home.match(/data-float-clear/g) || []).length >= 3, "curiosity row, showcase header and selector are marked");
});

test("unified /connect flow and removal of scattered homepage contact blocks", () => {
  const home = read("app/page.tsx");
  assert.doesNotMatch(home, /Five ways to start/, "Five ways to start grid must be removed");
  assert.doesNotMatch(home, /qc-band/, "redundant homepage contact band must be removed");
  const connectPage = read("app/connect/page.tsx");
  assert.match(connectPage, /Say hello\./);
  assert.match(connectPage, /Have an idea, a question, or just want to connect\? My inbox is open\./);
  const connectForm = read("components/ConnectForm.tsx");
  assert.match(connectForm, /Add your name \(optional\)/);
  assert.match(connectForm, /Message sent\. Thanks for reaching out\./);
  assert.match(connectForm, /Couldn't send your message\. You can email me directly instead\./);
  assert.doesNotMatch(connectForm, /type="radio"|name="budget"|name="timeline"|name="service"|name="project"/);
  const contactActions = read("components/ContactActions.tsx");
  assert.match(contactActions, /Email copied\./);
  assert.match(contactActions, /path\.startsWith\("\/connect"\)/, "mobile rail hides on /connect");
});

test("all color usage in identities.css resolves through --j-* variables (no raw hexes)", () => {
  const identities = read("app/identities.css");
  assert.doesNotMatch(identities, /#[0-9a-fA-F]{3,8}\b/, "hex values belong only in token definitions");
  for (const primitive of [".j-surface", ".j-inset", ".j-pressable", ".j-scene"]) {
    assert.ok(identities.includes(primitive), `missing material primitive ${primitive}`);
  }
});

test("'Stay curious.' is reachable above the fold: a second trigger in the byline opens the same shelf", () => {
  const home = read("app/page.tsx");
  assert.match(home, /<SecretShelfTrigger \/>/);
  assert.match(home, /<SecretShelf \/>/, "the inline trigger and the dialog stay");
  const shelf = read("components/SecretShelf.tsx");
  assert.equal((shelf.match(/<dialog /g) || []).length, 1, "one dialog, so no duplicate ids");
  assert.match(read("app/journal.css"), /\.curiosity-switch--top \{ display:flex; \}/);
});
