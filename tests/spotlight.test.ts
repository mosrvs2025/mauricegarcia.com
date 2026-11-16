import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { loadProjects } from "../lib/content/load";
import { isShown } from "../lib/content/visibility";

const ultimate = () => loadProjects().filter(isShown).find((p) => p.slug === "ultimate")!;

test("Ultimate+ is featured, honestly labelled, and its screenshots are real files", () => {
  const p = ultimate();
  assert.equal(p.title, "Ultimate+");
  assert.equal(p.tier, "featured");
  assert.equal(p.track, "products");
  assert.equal(p.maturity, "prototype", "stays a prototype until there is an independently verified build (docs/PORTFOLIO_HIERARCHY.md)");
  assert.equal(p.disclosure.basis, "public-source");
  assert.equal(p.repoVisibility, "public");
  assert.equal(p.links.repo, "https://github.com/mosrvs2025/ultimate-android");
  assert.ok(p.links.other.some((l) => l.url === "https://github.com/mosrvs2025/ultimate-android/releases/latest"));
  // The nine screenshots the owner named, plus one 16:9 montage used on cards.
  for (const n of ["home", "storage", "footprint", "timeline", "focus", "rules", "hosts", "inbox-insights", "watch-history"]) {
    assert.ok(p.media.some((m) => m.src === `/projects/ultimate-${n}.webp`), `${n} screenshot missing from media`);
  }
  for (const m of p.media) assert.ok(fs.existsSync(`public${m.src}`), `${m.src} is not in public/`);
  assert.equal(p.media[0].src, "/projects/ultimate-montage.webp", "the first image is the 16:9 one that cards crop to");
  assert.deepEqual([p.media[0].width, p.media[0].height], [1280, 720]);
  // Screenshots are simulated renders; the page must never present them as photos of a real device.
  for (const m of p.media) assert.match(m.caption ?? "", /simulated phone with sample data/i, `${m.src} caption must say it is a simulated render`);
  assert.ok(p.limitations.some((l) => /simulated phone with sample data/i.test(l)));
});

test("Ultimate+ copy sticks to what the repository says", () => {
  const text = JSON.stringify(ultimate());
  assert.match(text, /2\.24\.0 \(build 146\)/);
  assert.match(text, /no ads, no analytics and no accounts/i);
  assert.match(text, /no internet permission/i);
  assert.doesNotMatch(text, /owner[- ]approved|testimonial|\d+\s*(downloads|users|installs)/i);
});

test("home page features Ultimate+ without displacing the hero player or the game link", () => {
  const home = fs.readFileSync("app/page.tsx", "utf8");
  assert.match(home, /<ProjectSpotlight/);
  assert.match(home, /projectBySlug\("ultimate"\)/);
  assert.match(home, /<HomeShowcase/);
  assert.match(home, /Play this site as a game/);
  // The spotlight is not repeated in the three "doors" below it.
  assert.match(home, /spotlight \? \[spotlight\.slug\]/);
  assert.ok(home.indexOf("<ProjectSpotlight") > home.indexOf("<Ticker"), "spotlight sits below the hero and ticker");
});

test("projects not authored here are not presented as mine", () => {
  // REA is morluto's project (this account only holds a fork); vampire-game is an empty repository.
  const all = loadProjects();
  for (const p of all) {
    assert.doesNotMatch(p.links.repo ?? "", /mosrvs2025\/(rea|vampire-game)$/i, `${p.slug} links a repo that is not substantive or not mine`);
  }
});
