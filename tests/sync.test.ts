import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { candidateFromFile, promoteCandidate, runSync, updateIdFor } from "../lib/sync/import";
import { decidePublication } from "../lib/sync/rule";
import { sanitizeText, validEvidenceUrl } from "../lib/sync/sanitize";
import { candidateSchema } from "../lib/content/schemas";
import { cand, fakeClient, project, source, tmpDir } from "./helpers";

const NOW = new Date("2026-10-29T12:00:00Z");
const run = (dir: string, client: ReturnType<typeof fakeClient>, src = source(), proj = project()) =>
  runSync({ contentDir: dir, sources: [src], projects: [proj], client, now: NOW });
const candFiles = (dir: string) => { const d = path.join(dir, "candidates", "prj-demo"); return fs.existsSync(d) ? fs.readdirSync(d) : []; };
const updates = (dir: string) => { const d = path.join(dir, "updates"); return fs.existsSync(d) ? fs.readdirSync(d).map((f) => JSON.parse(fs.readFileSync(path.join(d, f), "utf8"))) : []; };
const file = (c: object) => JSON.stringify(c);

test("sanitizeText strips markup, links and control characters", () => {
  const out = sanitizeText("Hello <script>alert(1)</script> [click](https://evil.example) https://evil.example/x ‮evil\u0000", 200);
  assert.ok(!/[<>]|https?:|‮|\u0000/.test(out), out);
});

test("evidence URLs must point back into the same repository", () => {
  assert.ok(validEvidenceUrl("https://github.com/o/r/pull/3", "o/r"));
  assert.equal(validEvidenceUrl("https://github.com/other/r/pull/3", "o/r"), undefined);
  assert.equal(validEvidenceUrl("https://evil.example/o/r/pull/3", "o/r"), undefined);
  assert.equal(validEvidenceUrl("javascript:alert(1)", "o/r"), undefined);
});

test("website-update files: wrong project, not public-safe, oversize and bad JSON are rejected", () => {
  const s = source();
  assert.ok(candidateFromFile(file(cand()), s).candidate);
  assert.match(candidateFromFile(file(cand({ projectId: "prj-other" })), s).reject!, /does not belong/);
  assert.match(candidateFromFile(file(cand({ publicSafe: false })), s).reject!, /publicSafe/);
  assert.match(candidateFromFile("{nope", s).reject!, /JSON/);
  assert.match(candidateFromFile(file(cand({ summary: "x".repeat(9000) })), s).reject!, /8 KB/);
});

test("a file cannot self-certify completion or smuggle foreign evidence", () => {
  const { candidate } = candidateFromFile(file(cand({ evidenceUrl: "https://github.com/evil/repo/pull/1", completion: { kind: "merged-pull-request", verified: true } })), source());
  assert.equal(candidate!.completion.verified, false);
  assert.equal(candidate!.evidenceUrl, undefined);
});

test("an approved source event imports once; retries create no duplicates", async () => {
  const dir = tmpDir(); const client = fakeClient({ files: { ".website/updates/a.json": file(cand()) } });
  const a = await run(dir, client);
  assert.equal(a.results[0].imported, 1); assert.equal(candFiles(dir).length, 1); assert.equal(updates(dir).length, 1);
  const before = fs.readFileSync(path.join(dir, "candidates/prj-demo", candFiles(dir)[0]), "utf8");
  const b = await run(dir, client);
  assert.equal(b.results[0].imported, 0); assert.equal(b.results[0].unchanged, 1);
  assert.equal(candFiles(dir).length, 1); assert.equal(updates(dir).length, 1);
  assert.equal(fs.readFileSync(path.join(dir, "candidates/prj-demo", candFiles(dir)[0]), "utf8"), before, "unchanged retry must not rewrite");
});

test("a retry with changed text updates the same entry and keeps its slug and id", async () => {
  const dir = tmpDir(); const client = fakeClient({ files: { ".website/updates/a.json": file(cand()) } });
  await run(dir, client);
  const first = updates(dir)[0];
  client.data.files[".website/updates/a.json"] = file(cand({ summary: "Saves now work, including after a refresh." }));
  await run(dir, client);
  assert.equal(updates(dir).length, 1);
  assert.equal(updates(dir)[0].id, first.id); assert.equal(updates(dir)[0].slug, first.slug);
  assert.match(updates(dir)[0].summary, /after a refresh/);
});

test("new candidate prose is draft-only by default, even when it asks to publish", async () => {
  const dir = tmpDir();
  await run(dir, fakeClient({ files: { ".website/updates/a.json": file(cand({ state: "publish" })) } }));
  assert.equal(updates(dir)[0].status, "draft");
});

test("owner-edited and already-published updates are never overwritten by a sync", async () => {
  const dir = tmpDir(); const client = fakeClient({ files: { ".website/updates/a.json": file(cand()) } });
  await run(dir, client);
  const f = path.join(dir, "updates", fs.readdirSync(path.join(dir, "updates"))[0]);
  const u = JSON.parse(fs.readFileSync(f, "utf8"));
  u.title = "My own wording"; u.provenance.editedByOwner = true; u.status = "published"; u.publishedAt = "2026-10-29T00:00:00Z";
  fs.writeFileSync(f, JSON.stringify(u));
  client.data.files[".website/updates/a.json"] = file(cand({ title: "Changed upstream", summary: "Different" }));
  await run(dir, client);
  assert.equal(JSON.parse(fs.readFileSync(f, "utf8")).title, "My own wording");
  assert.equal(updates(dir).length, 1);
});

test("verified marked releases auto-publish only when opted in, public, and the project page is published", async () => {
  const rel = { id: 7, tag: "v1.2", name: "v1.2", body: "Adds saving.\n\nwebsite-update: public-safe\n", url: "https://github.com/o/r/releases/tag/v1.2", publishedAt: "2026-10-25T00:00:00Z", draft: false, prerelease: false };
  const mk = () => fakeClient({ releases: [rel] });
  let dir = tmpDir(); await run(dir, mk(), source({ autoPublish: false }));
  assert.equal(updates(dir)[0].status, "draft", "opt-in is per project");
  dir = tmpDir(); await run(dir, mk(), source({ autoPublish: true }), project({ status: "proposed" }));
  assert.equal(updates(dir)[0].status, "draft", "unpublished project page stays draft");
  dir = tmpDir(); await run(dir, mk(), source({ autoPublish: true }));
  assert.equal(updates(dir)[0].status, "published");
  assert.ok(updates(dir)[0].publishedAt);
  // unmarked release: always a draft with the review marker
  dir = tmpDir(); await run(dir, fakeClient({ releases: [{ ...rel, body: "Adds saving." }] }), source({ autoPublish: true }));
  assert.equal(updates(dir)[0].status, "draft"); assert.match(updates(dir)[0].whyCare, /Needs review/);
});

test("draft and prerelease releases are ignored", async () => {
  const dir = tmpDir(); const base = { id: 1, tag: "v", name: "v", body: "x\n\nwebsite-update: public-safe", url: "https://github.com/o/r/releases/tag/v", publishedAt: "2026-10-25T00:00:00Z" };
  await run(dir, fakeClient({ releases: [{ ...base, draft: true, prerelease: false }, { ...base, id: 2, draft: false, prerelease: true }] }));
  assert.equal(candFiles(dir).length, 0);
});

test("publication rule refuses unfinished or unverified claims", () => {
  const base = candidateSchema.parse(cand({ state: "publish", evidenceUrl: "https://github.com/o/r/releases/tag/v1", completion: { kind: "release", verified: true } }));
  const s = source({ autoPublish: true }); const p = project();
  assert.equal(decidePublication(base, s, p).publish, true);
  assert.equal(decidePublication({ ...base, status: "in-progress" }, s, p).publish, false);
  assert.equal(decidePublication({ ...base, completion: { kind: "release", verified: false } }, s, p).publish, false);
  assert.equal(decidePublication({ ...base, evidenceUrl: undefined }, s, p).publish, false);
  assert.equal(decidePublication({ ...base, publicSafe: false }, s, p).publish, false);
});

test("noisy merged PRs batch into one draft per closed window; the open window waits", async () => {
  const dir = tmpDir();
  const pulls = [
    { number: 1, title: "Fix jump", url: "https://github.com/o/r/pull/1", mergedAt: "2026-10-05T10:00:00Z", author: "a" },
    { number: 2, title: "Tune sword", url: "https://github.com/o/r/pull/2", mergedAt: "2026-10-06T10:00:00Z", author: "a" },
    { number: 3, title: "Too new <b>PR</b>", url: "https://github.com/o/r/pull/3", mergedAt: "2026-10-29T08:00:00Z", author: "a" },
  ];
  const client = fakeClient({ pulls });
  const r = await run(dir, client);
  assert.equal(r.results[0].imported, 1, "PRs 1 and 2 share a window; PR 3's window is still open");
  const u = updates(dir)[0]; assert.equal(u.status, "draft"); assert.match(u.whyCare, /Needs review/);
  assert.ok(!/<b>/.test(JSON.stringify(u)));
  assert.ok(client.calls.includes("pulls:dev"), "uses the configured branch, not main");
});

test("commit digest ignores merge commits and the site's own bot commits", async () => {
  const dir = tmpDir();
  const mk = (sha: string, message: string, author = "me") => ({ sha, message, url: `https://github.com/o/r/commit/${sha}`, date: "2026-10-05T10:00:00Z", author });
  const client = fakeClient({ commits: [mk("aaaaaaa", "Add dash"), mk("bbbbbbb", "Merge pull request #1 from x"), mk("ccccccc", "Sync [site-sync]"), mk("ddddddd", "bot", "dependabot[bot]")] });
  await run(dir, client, source({ include: { releases: false, mergedPullRequests: false, websiteUpdateFiles: false, commitDigest: true } }));
  const u = updates(dir); assert.equal(u.length, 1); assert.match(u[0].title, /1 commit/);
});

test("upstream failure leaves existing candidates and updates untouched and records the error", async () => {
  const dir = tmpDir(); const client = fakeClient({ files: { ".website/updates/a.json": file(cand()) } });
  await run(dir, client);
  const snapshot = JSON.stringify([candFiles(dir), updates(dir)]);
  client.data.fail = "GitHub returned HTTP 502";
  const r = await run(dir, client);
  assert.equal(r.results[0].ok, false);
  assert.equal(JSON.stringify([candFiles(dir), updates(dir)]), snapshot);
  const status = JSON.parse(fs.readFileSync(path.join(dir, "sync-status.json"), "utf8"));
  assert.match(status.sources["src-demo"].lastError, /502/);
  assert.ok(status.sources["src-demo"].lastSuccessAt, "last good sync time is preserved");
  assert.equal(status.lastSuccessAt, "2026-10-29T12:00:00.000Z");
});

test("one failing source does not block the others", async () => {
  const dir = tmpDir(); const good = fakeClient({ files: { ".website/updates/a.json": file(cand()) } });
  const bad = source({ id: "src-bad", repo: "o/bad", projectId: "prj-bad" });
  const client = { ...good, async listDir(repo: string, p: string, ref: string) { if (repo === "o/bad") throw new Error("boom"); return good.listDir(repo, p, ref); } };
  const r = await runSync({ contentDir: dir, sources: [source(), bad], projects: [project()], client, now: NOW });
  assert.deepEqual(r.results.map((x) => x.ok), [true, false]);
  assert.equal(candFiles(dir).length, 1);
});

test("tokens never appear in recorded errors", async () => {
  const dir = tmpDir(); const client = fakeClient({ fail: "bad credentials ghp_abcdefghijklmnopqrstuvwxyz0123456789" });
  const r = await run(dir, client);
  assert.ok(!/ghp_/.test(r.results[0].error!));
});

test("private sources are never read or written into the public repository", async () => {
  const dir = tmpDir(); const client = fakeClient({ files: { ".website/updates/a.json": file(cand()) } });
  const priv = source({ visibility: "private", include: { releases: false, mergedPullRequests: false, websiteUpdateFiles: true, commitDigest: false }, approvedPublicSummary: "A summary I approved." });
  const r = await runSync({ contentDir: dir, sources: [priv], projects: [project()], client, now: NOW });
  assert.equal(candFiles(dir).length, 0); assert.equal(updates(dir).length, 0);
  assert.deepEqual(client.calls, []);
  assert.match(r.results[0].error!, /private/);
});

test("promotion is deterministic: same event id, same update id", () => {
  assert.equal(updateIdFor("evt-1"), updateIdFor("evt-1"));
  const c = candidateSchema.parse(cand());
  const a = promoteCandidate(c, source(), project(), [], NOW); const b = promoteCandidate(c, source(), project(), a.update ? [a.update] : [], NOW);
  assert.equal(a.update!.id, b.update!.id); assert.equal(b.action, "refresh"); assert.equal(a.update!.slug, b.update!.slug);
});
