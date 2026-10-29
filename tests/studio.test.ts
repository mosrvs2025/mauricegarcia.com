import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { authConfig, checkPassphrase, createSession, resetThrottle, sameOrigin, throttle, verifySession } from "../lib/studio/auth";
import { configuredStore, fsStore, githubStore, StoreConflict, StoreError } from "../lib/studio/store";
import { getItem, historyOf, listAll, newUpdateDoc, restoreVersion, saveItem, setStatus, ValidationFailed } from "../lib/studio/service";
import { isShown } from "../lib/content/visibility";
import { tmpDir } from "./helpers";

function repo() {
  const root = tmpDir();
  const git = (...a: string[]) => execFileSync("git", a, { cwd: root, stdio: "pipe" });
  git("init", "-q"); git("config", "user.email", "t@t"); git("config", "user.name", "t");
  fs.mkdirSync(path.join(root, "content/projects"), { recursive: true });
  fs.copyFileSync(path.join(process.cwd(), "content/projects/gridheart.json"), path.join(root, "content/projects/gridheart.json"));
  git("add", "."); git("commit", "-qm", "init");
  return root;
}

test("an update can be drafted, previewed, published, edited and rolled back; every step is a commit", async () => {
  const store = fsStore(repo());
  const draft = { ...newUpdateDoc("Playtest weekend"), summary: "Three people played Gridheart this weekend.", projectId: "prj-gridheart" };
  const a = await saveItem(store, { type: "update", doc: draft });
  let item = await getItem(store, "update", draft.id);
  assert.equal(item!.doc.status, "draft"); assert.equal(isShown(item!.doc as any), false, "a draft is never public");

  const pub = await setStatus(store, "update", draft.id, "published", new Date("2026-10-30T09:00:00Z"));
  item = await getItem(store, "update", draft.id);
  assert.equal(isShown(item!.doc as any), true);
  assert.equal((item!.doc as any).publishedAt, "2026-10-30T09:00:00.000Z");

  await saveItem(store, { type: "update", doc: { ...(item!.doc as any), title: "Playtest weekend, edited" }, expectedSha: item!.sha });
  item = await getItem(store, "update", draft.id);
  assert.equal((item!.doc as any).title, "Playtest weekend, edited");
  assert.equal((item!.doc as any).provenance.editedByOwner, true);

  const hist = await historyOf(store, a.path);
  assert.equal(hist.length, 3);
  // roll back to the draft version
  await restoreVersion(store, "update", a.path, a.commit);
  item = await getItem(store, "update", draft.id);
  assert.equal(item!.doc.status, "draft"); assert.equal(isShown(item!.doc as any), false);
  assert.equal((await historyOf(store, a.path)).length, 4, "rollback is a new commit, not a rewrite");
  void pub;
});

test("invalid content is refused before anything is committed", async () => {
  const store = fsStore(repo());
  const doc = { ...newUpdateDoc("Bad"), summary: "", projectId: "prj-nope" };
  await assert.rejects(() => saveItem(store, { type: "update", doc }), ValidationFailed);
  await assert.rejects(() => saveItem(store, { type: "update", doc: { ...newUpdateDoc("Unknown"), projectId: "prj-nope" } }), /unknown project/);
  await assert.rejects(() => saveItem(store, { type: "update", doc: { ...newUpdateDoc("Marker"), status: "published", summary: "[Needs review] x" } }), /marker/);
  assert.deepEqual((await listAll(store)).filter((e) => e.type === "update"), []);
});

test("a stale editor cannot overwrite a newer version", async () => {
  const store = fsStore(repo());
  const d = newUpdateDoc("Race"); await saveItem(store, { type: "update", doc: d });
  const first = await getItem(store, "update", d.id);
  await saveItem(store, { type: "update", doc: { ...d, title: "Race one" }, expectedSha: first!.sha });
  await assert.rejects(() => saveItem(store, { type: "update", doc: { ...d, title: "Race two" }, expectedSha: first!.sha }), StoreConflict);
});

test("a post round-trips through Markdown, and the Now page records who reviewed it", async () => {
  const store = fsStore(repo());
  const post = { id: "post-hello", slug: "hello", title: "Hello", description: "A first post.", status: "draft", visibility: "public", kind: "essay", tags: [], projectIds: [], provenance: { origin: "manual" }, body: "Some **words**." };
  await saveItem(store, { type: "post", doc: post });
  const got = await getItem(store, "post", "post-hello");
  assert.equal((got!.doc as any).body.trim(), "Some **words**.");
  await setStatus(store, "post", "post-hello", "published");
  assert.equal((await getItem(store, "post", "post-hello"))!.doc.status, "published");
  const now = { id: "now", status: "proposed", visibility: "public", focus: "Testing.", building: [], exploring: [], welcome: [], reviewedAt: "2026-10-29", reviewedBy: "pending" };
  await saveItem(store, { type: "now", doc: now });
  assert.equal(((await getItem(store, "now", "now"))!.doc as any).reviewedBy, "owner");
});

test("store refuses paths outside content/", async () => {
  const store = fsStore(repo());
  await assert.rejects(() => store.read("../etc/passwd"), StoreError);
  await assert.rejects(() => store.write("package.json", "{}", "x"), StoreError);
  await assert.rejects(() => store.readAt("content/now.json", "--output=/tmp/x"), StoreError);
});

test("GitHub store sends the token only to api.github.com, uses the configured branch, and surfaces conflicts", async () => {
  const seen: { url: string; auth: string | null; body?: any }[] = [];
  const fetchImpl = (async (url: string, init: any) => {
    seen.push({ url, auth: init.headers.Authorization, body: init.body ? JSON.parse(init.body) : undefined });
    if (init.method === "PUT") return new Response("{}", { status: 409 });
    return new Response("[]", { status: 200 });
  }) as unknown as typeof fetch;
  const s = githubStore({ token: "tok", repo: "o/r", branch: "main", fetchImpl });
  await s.list("content/updates");
  await assert.rejects(() => s.write("content/now.json", "{}", "m", "abc"), StoreConflict);
  assert.ok(seen.every((c) => c.url.startsWith("https://api.github.com/repos/o/r/") && c.auth === "Bearer tok"));
  assert.equal(seen[1].body.branch, "main");
});

test("storage is honest when unconfigured", () => {
  assert.match(configuredStore({} as any).reason!, /STUDIO_GITHUB_TOKEN/);
  assert.match(configuredStore({ STUDIO_STORAGE: "fs", NODE_ENV: "production" } as any).reason!, /outside production/);
});

test("sessions: signed, expiring, tamper-proof; passphrase checked in constant time; login throttled", () => {
  const cfg = authConfig({ STUDIO_PASSPHRASE: "correct horse battery", STUDIO_SESSION_SECRET: "s".repeat(40) } as any);
  assert.equal(cfg.ok, true); if (!cfg.ok) return;
  const c = createSession(cfg.secret, 1000);
  assert.equal(verifySession(c, cfg.secret, 2000), true);
  assert.equal(verifySession(c, cfg.secret, 1000 + 13 * 3600_000), false, "expired");
  assert.equal(verifySession(c.replace(/.$/, "x"), cfg.secret, 2000), false, "tampered");
  assert.equal(verifySession(c, "other".repeat(10), 2000), false, "wrong secret");
  assert.equal(verifySession(undefined, cfg.secret), false);
  assert.equal(checkPassphrase("correct horse battery", cfg.passphrase), true);
  assert.equal(checkPassphrase("guess", cfg.passphrase), false);
  assert.equal(authConfig({ STUDIO_PASSPHRASE: "short", STUDIO_SESSION_SECRET: "s".repeat(40) } as any).ok, false);
  resetThrottle(); for (let i = 0; i < 6; i++) assert.equal(throttle("ip", 1000), true);
  assert.equal(throttle("ip", 1000), false);
});

test("state-changing studio calls require a same-origin Origin header", () => {
  const mk = (origin?: string) => new Request("https://mauricegarcia.com/api/studio/save", { method: "POST", headers: origin ? { origin } : {} });
  assert.equal(sameOrigin(mk("https://mauricegarcia.com")), true);
  assert.equal(sameOrigin(mk("https://evil.example")), false);
  assert.equal(sameOrigin(mk()), false);
});
