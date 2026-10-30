import assert from "node:assert/strict";
import vm from "node:vm";
import { test } from "node:test";
import { capabilities } from "../lib/capabilities";
import { lessonFrontmatterSchema } from "../lib/content/schemas";
import { loadProjects } from "../lib/content/load";
import { services } from "../lib/services";
import { youtubeChannelUrl } from "../lib/site";
import { LEGACY_PREFIXES, SITE_SKINS, SKIN_BOOT_SCRIPT } from "../lib/skin";
import { isShown } from "../lib/content/visibility";

// These run against the real content in this repository.
const projects = loadProjects();
const shown = projects.filter(isShown);
const bySlug = new Map(shown.map((p) => [p.slug, p]));

test("the deliberate hierarchy: the practical products and a game and a lab are all featured", () => {
  for (const slug of ["pipeline-crm", "thriftscout", "ultimate"]) assert.equal(bySlug.get(slug)?.tier, "featured", `${slug} must be featured`);
  for (const track of ["products", "experiences", "labs"] as const) {
    const featured = shown.filter((p) => p.track === track && p.tier === "featured");
    assert.ok(featured.length >= 3, `${track} needs at least three featured projects`);
  }
  assert.ok(shown.filter((p) => p.track === "experiences").length >= 5, "games and experiments are not buried");
});

test("private-repo work is shown only with documented permission, and never links its repository", () => {
  for (const p of shown.filter((p) => p.repoVisibility === "private")) {
    assert.equal(p.disclosure.basis, "owner-documented", p.slug);
    assert.ok(p.disclosure.documentedAt, p.slug);
    assert.equal(p.links.repo, undefined, p.slug);
  }
  // Work without documented permission stays hidden.
  for (const slug of ["cognition-os", "tuck", "breannas-cleaning-yard-care", "living-cosmos", "game-fusion", "devolution"]) {
    assert.equal(bySlug.has(slug), false, `${slug} must stay hidden until permission is documented`);
  }
});

test("every maturity label is backed by evidence the schema can check", () => {
  for (const p of shown) {
    if (p.maturity === "beta") assert.ok(p.links.demo, `${p.slug}: beta needs a public demo`);
    if (p.maturity === "production") assert.equal(p.disclosure.basis, "owner-documented", p.slug);
  }
  assert.equal(bySlug.get("pipeline-crm")!.maturity, "production");
  assert.equal(bySlug.get("thriftscout")!.maturity, "beta");
});

test("no invented numbers: services use custom quotes, and commercial directions are intentions only", () => {
  for (const s of services.filter((s) => s.kind === "software")) assert.match(s.price, /custom quote|quoted to|Monthly plan|Sessions quoted/i, `${s.slug}: ${s.price}`);
  for (const p of shown) for (const c of p.openTo) assert.ok(["custom-development", "subscription", "licensing", "education", "partnership"].includes(c));
  for (const p of shown) for (const text of [p.tagline, p.problem, p.contribution, p.stateNote ?? ""]) assert.ok(!/\$\d|testimonial|\d+\s*(customers|users|subscribers)/i.test(text), `${p.slug}: unsupported figure or claim in "${text.slice(0, 60)}"`);
});

test("every capability on the site points at published proof", () => {
  for (const c of capabilities) for (const slug of c.proof) assert.ok(bySlug.has(slug), `${c.id} cites ${slug}, which is not published`);
});

test("Learn: lessons need real YouTube ids, the channel link is never invented, and no lessons are fabricated", () => {
  const base = { id: "l1", slug: "l1", title: "T", summary: "S", kind: "tutorial", level: "beginner", status: "draft", visibility: "public" };
  assert.ok(lessonFrontmatterSchema.safeParse(base).success);
  assert.ok(!lessonFrontmatterSchema.safeParse({ ...base, kind: "video" }).success, "video lessons need youtubeId");
  assert.ok(lessonFrontmatterSchema.safeParse({ ...base, kind: "video", youtubeId: "dQw4w9WgXcQ" }).success);
  assert.ok(!lessonFrontmatterSchema.safeParse({ ...base, kind: "video", youtubeId: "https://youtu.be/dQw4w9WgXcQ" }).success, "an id, not a URL");
  assert.ok(!lessonFrontmatterSchema.safeParse({ ...base, tools: ["a"].concat(Array(8).fill("x")) }).success);
  delete process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL;
  assert.equal(youtubeChannelUrl(), null);
  process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL = "https://evil.example/@me"; assert.equal(youtubeChannelUrl(), null);
  process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL = "javascript:alert(1)"; assert.equal(youtubeChannelUrl(), null);
  process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@somebody"; assert.equal(youtubeChannelUrl(), "https://www.youtube.com/@somebody");
  delete process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL;
});

test("style switcher: boot script is valid, only applies known styles, and skips legacy pages", () => {
  const run = (path: string, search: string, saved: string | null) => {
    const store: Record<string, string> = saved ? { "mg-skin": saved } : {};
    const attrs: Record<string, string> = {};
    const ctx = { location: { pathname: path, search }, URLSearchParams, localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } }, document: { documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v; }, removeAttribute: (k: string) => { delete attrs[k]; } } } };
    vm.runInNewContext(SKIN_BOOT_SCRIPT, ctx);
    return { attrs, store };
  };
  assert.equal(run("/projects", "", "paper").attrs["data-skin"], "paper");
  assert.equal(run("/projects", "?skin=terminal", null).attrs["data-skin"], "terminal", "shareable ?skin= link");
  assert.equal(run("/projects", "?skin=terminal", null).store["mg-skin"], "terminal");
  assert.equal(run("/projects", "?skin=workshop", "paper").attrs["data-skin"], undefined, "workshop clears the choice");
  assert.equal(run("/projects", "?skin=<script>", null).attrs["data-skin"], undefined, "unknown values are ignored");
  assert.equal(run("/projects", "", "evil\"quote").attrs["data-skin"], undefined);
  for (const legacy of ["/coaching", "/shop/success", "/studio", "/lab/arcade", "/ai-receptionist", "/ads"]) assert.equal(run(legacy, "", "paper").attrs["data-skin"], undefined, legacy);
  assert.ok(LEGACY_PREFIXES.test("/shop") && !LEGACY_PREFIXES.test("/shopping") && !LEGACY_PREFIXES.test("/projects"));
  assert.equal(SITE_SKINS[0].id, "workshop");
  assert.equal(new Set(SITE_SKINS.map((s) => s.id)).size, SITE_SKINS.length);
});
