import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import { capabilities } from "../lib/capabilities";
import { lessonFrontmatterSchema } from "../lib/content/schemas";
import { loadProjects, loadSources } from "../lib/content/load";
import { services } from "../lib/services";
import { youtubeChannelUrl } from "../lib/site";
import { CLASSIC_SKINS, DEFAULT_SKIN, IDENTITY_SKINS, LEGACY_PREFIXES, SITE_SKINS, SKIN_BOOT_SCRIPT, skinMeta } from "../lib/skin";
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

test("style switcher: boot script is valid, always sets data-skin, only applies known styles, and sends legacy pages to the classic look", () => {
  const run = (path: string, search: string, saved: string | null, blocked = false) => {
    const store: Record<string, string> = saved ? { "mg-skin": saved } : {};
    const attrs: Record<string, string> = {};
    const blockedStorage = () => { throw new Error("storage blocked"); };
    const localStorage = blocked
      ? { getItem: blockedStorage, setItem: blockedStorage, removeItem: blockedStorage }
      : { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
    const ctx = { location: { pathname: path, search }, URLSearchParams, localStorage, document: { documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v; }, removeAttribute: (k: string) => { delete attrs[k]; } } } };
    vm.runInNewContext(SKIN_BOOT_SCRIPT, ctx);
    return { attrs, store };
  };
  // The default identity is Open Case, and the attribute is always present (so there is never a flash of the wrong skin).
  assert.equal(DEFAULT_SKIN, "open-case");
  assert.equal(run("/projects", "", null).attrs["data-skin"], "open-case", "first-time visitors see Open Case");
  assert.equal(run("/projects", "", null).attrs["data-kind"], "identity");
  assert.equal(run("/projects", "", "paper").attrs["data-skin"], "paper", "remembered choice");
  assert.equal(run("/projects", "", "paper").attrs["data-kind"], "classic");
  for (const id of ["open-case", "rogue-instrument", "unauthorized-manual", "workshop", "paper", "terminal", "pop", "glass", "swiss", "arcade"]) {
    assert.equal(run("/projects", `?skin=${id}`, null).attrs["data-skin"], id, `shareable ?skin=${id} link`);
    assert.equal(run("/projects", `?skin=${id}`, null).store["mg-skin"], id, `?skin=${id} is remembered`);
  }
  assert.equal(run("/projects", "?skin=rogue-instrument", "paper").attrs["data-skin"], "rogue-instrument", "a shared link beats the saved choice");
  const reset = run("/projects", "?skin=default", "paper");
  assert.equal(reset.attrs["data-skin"], "open-case", "?skin=default returns to the default identity");
  assert.equal(reset.store["mg-skin"], undefined, "...and forgets the saved choice");
  assert.equal(run("/projects", "?skin=<script>", null).attrs["data-skin"], "open-case", "unknown values are ignored");
  assert.equal(run("/projects", "", "evil\"quote").attrs["data-skin"], "open-case");
  assert.equal(run("/projects", "?skin=terminal", null, true).attrs["data-skin"], "terminal", "blocked storage still honours a shared link for the page");
  assert.equal(run("/projects", "", null, true).attrs["data-skin"], "open-case", "blocked storage falls back to the default");
  for (const legacy of ["/coaching", "/shop/success", "/studio", "/lab/arcade", "/ai-receptionist", "/ads"]) assert.equal(run(legacy, "", "paper").attrs["data-skin"], "workshop", `${legacy} keeps the classic Workshop look`);
  assert.ok(LEGACY_PREFIXES.test("/shop") && !LEGACY_PREFIXES.test("/shopping") && !LEGACY_PREFIXES.test("/projects"));
  // The three identities lead, the seven older skins follow (all kept), ids are unique, and every skin has what the switcher needs.
  assert.deepEqual(SITE_SKINS.slice(0, 3).map((s) => s.id), ["open-case", "rogue-instrument", "unauthorized-manual"]);
  assert.deepEqual(IDENTITY_SKINS.map((s) => s.id), ["open-case", "rogue-instrument", "unauthorized-manual"]);
  assert.deepEqual(CLASSIC_SKINS.map((s) => s.id), ["workshop", "paper", "terminal", "pop", "glass", "swiss", "arcade"]);
  assert.equal(new Set(SITE_SKINS.map((s) => s.id)).size, SITE_SKINS.length);
  for (const s of SITE_SKINS) assert.ok(s.name && s.note && s.swatch.length === 3 && /^#[0-9a-f]{6}$/i.test(s.themeColor), `${s.id} is missing switcher data`);
  assert.equal(skinMeta("workshop").name, "Workshop (classic)");
});

test("identity design system: fonts, palettes and signature pieces are in place and old faces are not the default", () => {
  const layout = fs.readFileSync("app/layout.tsx", "utf8");
  for (const f of ["Manrope", "DM_Sans", "Syne", "Space_Grotesk", "Outfit", "IBM_Plex_Sans"]) assert.match(layout, new RegExp(`\\b${f}\\(`), `${f} must be loaded through next/font`);
  // Only the default identity's faces (Softworks: Manrope + DM Sans) are preloaded; the rest are fetched on demand.
  for (const f of ["syne", "spaceGrotesk", "outfit", "plex", "fraunces", "instrument"]) assert.match(layout, new RegExp(`const ${f} = [^\\n]*preload: false`), `${f} must not be preloaded`);
  assert.doesNotMatch(layout.match(/const manrope = [^\n]*/)![0] + layout.match(/const dmSans = [^\n]*/)![0], /preload: false/);
  const globals = fs.readFileSync("app/globals.css", "utf8");
  assert.match(globals, /--font-display: var\(--font-manrope\)/);
  assert.match(globals, /--font-sans: var\(--font-dm-sans\)/);
  assert.doesNotMatch(globals + fs.readFileSync("app/journal.css", "utf8"), /font-variation-settings:\s*"opsz" 96;?\s*\}?\s*$/m, "the Fraunces-only optical size override must stay scoped to the skins that use Fraunces");
  const tokens = fs.readFileSync("app/tokens.css", "utf8");
  for (const hex of ["#E8EEF2", "#1B2B3A", "#4C6070", "#155E8A", "#B6C6D1", "#D0E4F1", "#090D15", "#172233", "#F8FAFF", "#72E4FF", "#FF5C9B", "#0B1423", "#142A3C", "#F8FBFF", "#9EF3DC", "#43599C", "#2CB4B1"]) {
    assert.ok(tokens.toUpperCase().includes(hex.toUpperCase()), `${hex} missing from tokens`);
  }
  const annotation = fs.readFileSync("components/CaseAnnotation.tsx", "utf8");
  assert.match(annotation, /aria-expanded/); assert.match(annotation, /aria-controls/); assert.match(annotation, /Source:/);
  assert.match(fs.readFileSync("app/page.tsx", "utf8"), /<CaseAnnotation/);
});

test("every public portfolio repository has an enabled matching update source", () => {
  const sources = loadSources();
  for (const p of projects.filter((p) => p.repoVisibility === "public" && p.links.repo)) {
    const repo = p.links.repo!.replace("https://github.com/", "");
    assert.ok(sources.some((s) => s.enabled && s.visibility === "public" && s.projectId === p.id && s.repo.toLowerCase() === repo.toLowerCase()), `${p.slug}: add a verified source when adding a public project`);
  }
});
