import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { tmpDir } from "./helpers";

// Build a throwaway content tree with every kind of item a visitor must NOT see, plus one they should.
const dir = tmpDir();
process.env.CONTENT_DIR = dir;
const put = (rel: string, data: unknown) => { const f = path.join(dir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof data === "string" ? data : JSON.stringify(data, null, 2)); };
const base = { tagline: "t", tier: "featured", themes: ["games"], state: "prototype", problem: "p", audience: "a", contribution: "c", worksToday: [], limitations: [], links: { other: [] }, repoVisibility: "none", ai: { assisted: "unknown" }, dates: { reviewed: "2026-10-29" }, evidence: [{ label: "e", url: "https://example.com/e", kind: "other" }], involve: { headline: "h", asks: ["a"], intent: "hello" } };
const proj = (id: string, over: object) => put(`projects/${id}.json`, { id, slug: id.replace("prj-", ""), title: id, ...base, status: "published", visibility: "public", ...over });
proj("prj-live", {}); proj("prj-draft", { status: "draft" }); proj("prj-private", { visibility: "private" }); proj("prj-unlisted", { visibility: "unlisted" }); proj("prj-proposed", { status: "proposed" });
const upd = (id: string, over: object) => put(`updates/${id}.json`, { id, slug: id, title: `Title ${id}`, summary: `Summary ${id}`, kind: "note", status: "published", visibility: "public", eventAt: "2026-10-01", publishedAt: "2026-10-02T00:00:00Z", tags: [], evidence: [], provenance: { origin: "manual" }, ...over });
upd("upd-live", {}); upd("upd-draft", { status: "draft", publishedAt: undefined }); upd("upd-private", { visibility: "private" }); upd("upd-unlisted", { visibility: "unlisted" }); upd("upd-amp", { title: "Fish & <chips>", summary: "a < b & \u0007bell" });
const post = (slug: string, fm: object) => put(`posts/${slug}.md`, `---\n${Object.entries({ id: `post-${slug}`, slug, title: `Post ${slug}`, description: "d", kind: "essay", status: "published", visibility: "public", publishedAt: "2026-10-02T00:00:00Z", ...fm }).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n")}\n---\nBody ${slug}\n`);
post("live", {}); post("draft", { status: "draft", publishedAt: undefined });

const q = () => import("../lib/content/query");
const feeds = () => import("../lib/feeds");

test("only published, non-private items get pages; only public ones are listed", async () => {
  const m = await q();
  assert.deepEqual(m.shownProjects().map((p) => p.id).sort(), ["prj-live", "prj-unlisted"]);
  assert.deepEqual(m.listedProjects().map((p) => p.id), ["prj-live"]);
  assert.equal(m.projectBySlug("draft"), undefined); assert.equal(m.projectBySlug("private"), undefined); assert.equal(m.projectBySlug("proposed"), undefined);
  assert.equal(m.updateBySlug("upd-draft"), undefined); assert.equal(m.updateBySlug("upd-private"), undefined);
  assert.ok(m.updateBySlug("upd-unlisted"), "unlisted has a page");
  assert.ok(!m.listedUpdates().some((u) => u.id === "upd-unlisted"));
  assert.equal(m.postBySlug("draft"), undefined); assert.ok(m.postBySlug("live"));
});

test("'proposed' content appears only on preview builds and never on a production deployment", async () => {
  const { isShown } = await import("../lib/content/visibility");
  const item = { status: "proposed", visibility: "public" };
  delete process.env.SITE_PREVIEW; assert.equal(isShown(item), false);
  process.env.SITE_PREVIEW = "1"; assert.equal(isShown(item), true);
  process.env.VERCEL_ENV = "production"; assert.equal(isShown(item), false, "SITE_PREVIEW is ignored in production");
  delete process.env.VERCEL_ENV; delete process.env.SITE_PREVIEW;
  assert.equal(isShown({ status: "draft", visibility: "public" }), false);
  assert.equal(isShown({ status: "published", visibility: "private" }), false);
});

test("feeds contain only listed items, escape XML, and strip control characters", async () => {
  const { listedUpdates } = await q(); const { rss } = await feeds();
  const xml = rss({ title: "t", description: "d", path: "/updates/rss.xml", items: listedUpdates().map((u) => ({ id: u.id, title: u.title, url: `https://x/${u.slug}`, summary: u.summary, date: u.eventAt.length === 10 ? `${u.eventAt}T12:00:00Z` : u.eventAt })) });
  assert.ok(xml.includes("upd-live") && xml.includes("upd-amp"));
  for (const hidden of ["upd-draft", "upd-private", "upd-unlisted", "Summary upd-draft"]) assert.ok(!xml.includes(hidden), hidden);
  assert.ok(xml.includes("Fish &amp; &lt;chips&gt;")); assert.ok(!/\u0007/.test(xml));
});

test("Markdown rendering never runs HTML or script URLs", async () => {
  const { renderMarkdown } = await import("../lib/content/markdown");
  const html = renderMarkdown("<script>alert(1)</script>\n\n[x](javascript:alert(1)) ![i](data:text/html;base64,AAA) <img src=x onerror=alert(1)> [ok](https://example.com)");
  assert.ok(!/<script|<img src=x|href="javascript|src="data:/i.test(html), html);
  assert.ok(html.includes('href="https://example.com"') && html.includes('rel="noopener noreferrer"'));
});

test("schemas refuse unsafe project claims", async () => {
  const { projectSchema } = await import("../lib/content/schemas");
  const ok = { id: "prj-x", slug: "x", title: "X", ...base, status: "published", visibility: "public" };
  assert.ok(projectSchema.safeParse(ok).success);
  assert.ok(!projectSchema.safeParse({ ...ok, repoVisibility: "private", links: { repo: "https://github.com/o/secret", other: [] } }).success, "private repo cannot be linked");
  assert.ok(!projectSchema.safeParse({ ...ok, repoVisibility: "private", links: { other: [] } }).success, "private-backed pages need approval flag");
  assert.ok(projectSchema.safeParse({ ...ok, repoVisibility: "private", privateSummaryApproved: true, links: { other: [] } }).success);
  assert.ok(!projectSchema.safeParse({ ...ok, evidence: [] }).success, "published needs evidence");
  assert.ok(!projectSchema.safeParse({ ...ok, links: { demo: "http://insecure.example", other: [] } }).success, "https only");
  assert.ok(!projectSchema.safeParse({ ...ok, slug: "Bad Slug" }).success);
});

test("duplicate ids and unresolved references are reported", async () => {
  put("updates/upd-orphan.json", { id: "upd-orphan", slug: "orphan", title: "o", summary: "s", kind: "note", status: "draft", visibility: "public", eventAt: "2026-10-01", tags: [], evidence: [], projectId: "prj-missing", provenance: { origin: "manual" } });
  const { validateAll } = await import("../lib/content/load");
  assert.ok(validateAll().some((p) => /unknown projectId prj-missing/.test(p)));
  fs.rmSync(path.join(dir, "updates/upd-orphan.json"));
  put("updates/dup.json", { id: "upd-live", slug: "dup", title: "d", summary: "s", kind: "note", status: "draft", visibility: "public", eventAt: "2026-10-01", tags: [], evidence: [], provenance: { origin: "manual" } });
  assert.throws(() => validateAll(), /Duplicate update id/);
});
