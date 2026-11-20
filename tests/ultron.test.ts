import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { loadProjects } from "../lib/content/load";
import { isShown } from "../lib/content/visibility";

const ultron = () => loadProjects().filter(isShown).find((p) => p.slug === "ultron")!;
const DASHBOARD = "https://ultron-moslab.vercel.app";

test("Ultron is featured first, honestly labelled, and does not leak a private repository", () => {
  const p = ultron();
  assert.equal(p.title, "Ultron");
  assert.equal(p.tier, "featured");
  assert.equal(p.track, "products");
  assert.equal(p.order, 1, "Ultron leads the featured set");
  assert.equal(p.maturity, "beta", "the hosted dashboard is live, so it is a beta");
  assert.equal(p.repoVisibility, "private");
  assert.equal(p.links.repo, undefined, "the private repository must not be linked");
  assert.equal(p.links.demo, DASHBOARD, "the live dashboard must be linked");
  assert.ok(p.links.other.some((l) => l.url === DASHBOARD && l.label === "Open the dashboard"));
  assert.equal(p.disclosure.basis, "owner-documented");
  assert.equal(p.disclosure.documentedAt, "2026-11-17");
  assert.ok(p.media.length >= 4);
  assert.equal(p.media[0].src, "/projects/ultron-constellation.webp");
  assert.deepEqual([p.media[0].width, p.media[0].height], [1280, 720]);
  for (const m of p.media) {
    assert.ok(fs.existsSync(`public${m.src}`), `${m.src} is not in public/`);
    assert.match(m.caption ?? "", /synthetic|test data/i, `${m.src} caption must say the screenshot is test or synthetic data`);
  }
  const text = JSON.stringify(p);
  assert.doesNotMatch(text, /github\.com\/mosrvs2025/i, "do not name the private repository");
  assert.doesNotMatch(text, /discord\.gg\//i, "do not publish a server invite");
  assert.match(text, /ultron-moslab\.vercel\.app/, "the live dashboard host should be present");
  assert.doesNotMatch(p.stateNote ?? "", /no public demo/i);
  assert.doesNotMatch(text, /always-on host|hosted database before a public URL/i);
  assert.doesNotMatch(text, /A public hosted dashboard is not available yet/i);
});

test("the home page leads Selected work with Ultron, then REALMBREAK, then Ultimate+", () => {
  const home = fs.readFileSync("app/page.tsx", "utf8");
  assert.match(home, /const showcase = \["ultron", "realmbreak", "ultimate"\]/);
  assert.match(home, /<HomeShowcase/);
  assert.match(home, /projectBySlug\("ultimate"\)/, "Ultimate+ stays the case-file spotlight");
  assert.match(home, /projectBySlug\("realmbreak"\)/);
  assert.doesNotMatch(home, /const showcase = \["thornwild"/);
});

test("the project page uses the dashboard label as the primary button and does not duplicate the link", () => {
  const page = fs.readFileSync("app/projects/[slug]/page.tsx", "utf8");
  assert.match(page, /p\.links\.other\.find\(\(l\) => l\.url === p\.links\.demo\)\?\.label/);
  assert.match(page, /p\.links\.other\.filter\(\(l\) => l\.url !== p\.links\.demo\)/);
});
