import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

const read = (f: string) => fs.readFileSync(f, "utf8");

// Mobile and legibility polish on top of the three identities. See docs/DESIGN.md ("Floating controls", "Numerals").

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

/** The literal token values for one identity (resolving the --brand-* aliases Open Case uses). */
function tokens(skin: "open-case" | "rogue-instrument" | "unauthorized-manual") {
  const css = read("app/tokens.css");
  const brand: Record<string, string> = {};
  for (const m of css.matchAll(/(--brand-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) brand[m[1]] = m[2];
  const start = skin === "open-case" ? css.indexOf(":root,") : css.indexOf(`html[data-skin="${skin}"] {`);
  const block = css.slice(start, css.indexOf("\n}", start));
  const get = (name: string) => {
    const m = block.match(new RegExp(`${name}:\\s*([^;]+);`));
    assert.ok(m, `${skin} defines ${name}`);
    const v = m[1].trim();
    const alias = v.match(/^var\((--brand-[\w-]+)\)$/);
    return alias ? brand[alias[1]] : v;
  };
  return { bg: get("--j-bg"), surface: get("--j-surface"), text: get("--j-text"), muted: get("--j-muted"), link: get("--j-link") };
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

test("floating controls: shared baseline on phones, the Playground starts as a pill, and they step aside for marked content", () => {
  const journal = read("app/journal.css");
  assert.match(journal, /--float-bottom:/);
  assert.match(journal, /html\[data-float-clear\] \.qc:not\(:focus-within\)/);
  assert.match(journal, /html\[data-float-clear\] \.play-dock:not\(:focus-within\)/);
  const play = read("app/play.css");
  assert.doesNotMatch(play, /\.play-dock \{ bottom:84px/, "no more stacking above Let's talk");
  assert.match(play, /\.play-dock \{ bottom:var\(--float-bottom/);
  assert.match(read("components/play/Playground.tsx"), /saved === null && matchMedia\("\(max-width: 900px\)"\)/);
  assert.match(read("app/layout.tsx"), /<FloatGuard \/>/);
  const home = read("app/page.tsx") + read("components/HomeShowcase.tsx");
  assert.ok((home.match(/data-float-clear/g) || []).length >= 3, "curiosity row, showcase header and selector are marked");
});

test("'Stay curious.' is reachable above the fold: a second trigger in the byline opens the same shelf", () => {
  const home = read("app/page.tsx");
  assert.match(home, /<SecretShelfTrigger \/>/);
  assert.match(home, /<SecretShelf \/>/, "the inline trigger and the dialog stay");
  const shelf = read("components/SecretShelf.tsx");
  assert.equal((shelf.match(/<dialog /g) || []).length, 1, "one dialog, so no duplicate ids");
  assert.match(read("app/journal.css"), /\.curiosity-switch--top \{ display:flex; \}/);
});
