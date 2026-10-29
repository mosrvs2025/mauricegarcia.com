import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export type StoredFile = { path: string; content: string; sha: string };
export type HistoryEntry = { sha: string; date: string; message: string; author: string };

/** Git-backed content store. Every write is a commit, which is what makes rollback honest. */
export interface ContentStore {
  readonly mode: "github" | "fs";
  list(dir: string): Promise<string[]>;
  read(file: string): Promise<StoredFile | null>;
  write(file: string, content: string, message: string, expectedSha?: string): Promise<{ sha: string }>;
  history(file: string, limit?: number): Promise<HistoryEntry[]>;
  readAt(file: string, ref: string): Promise<string | null>;
}

export class StoreConflict extends Error {}
export class StoreError extends Error {}

const SAFE_PATH = /^content\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+$/;
export function assertContentPath(p: string) {
  if (!SAFE_PATH.test(p) || p.includes("..")) throw new StoreError("path is outside content/");
}

/** GitHub Contents API. The token lives only on the server; the browser never sees it. */
export function githubStore(opts: { token: string; repo: string; branch: string; fetchImpl?: typeof fetch }): ContentStore {
  const f = opts.fetchImpl ?? fetch;
  const base = `https://api.github.com/repos/${opts.repo}`;
  async function api(p: string, init?: RequestInit) {
    const res = await f(`${base}${p}`, {
      ...init,
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "mauricegarcia-studio", Authorization: `Bearer ${opts.token}`, ...(init?.body ? { "Content-Type": "application/json" } : {}) },
      signal: AbortSignal.timeout(20000),
    });
    return res;
  }
  const enc = (p: string) => p.split("/").map(encodeURIComponent).join("/");
  const ref = `ref=${encodeURIComponent(opts.branch)}`;
  return {
    mode: "github",
    async list(dir) {
      assertContentPath(dir + "/x");
      const res = await api(`/contents/${enc(dir)}?${ref}`);
      if (res.status === 404) return [];
      if (!res.ok) throw new StoreError(`GitHub returned HTTP ${res.status} while listing ${dir}`);
      return ((await res.json()) as any[]).filter((e) => e.type === "file").map((e) => e.name as string);
    },
    async read(file) {
      assertContentPath(file);
      const res = await api(`/contents/${enc(file)}?${ref}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new StoreError(`GitHub returned HTTP ${res.status} while reading ${file}`);
      const j = (await res.json()) as any;
      return { path: file, content: Buffer.from(j.content, "base64").toString("utf8"), sha: j.sha };
    },
    async write(file, content, message, expectedSha) {
      assertContentPath(file);
      const res = await api(`/contents/${enc(file)}`, { method: "PUT", body: JSON.stringify({ message, content: Buffer.from(content).toString("base64"), branch: opts.branch, ...(expectedSha ? { sha: expectedSha } : {}) }) });
      if (res.status === 409 || res.status === 422) throw new StoreConflict("This file changed since you opened it. Reload to see the newer version before saving.");
      if (res.status === 401 || res.status === 403) throw new StoreError("GitHub refused the write. Check that the studio token has Contents: write on this repository.");
      if (!res.ok) throw new StoreError(`GitHub returned HTTP ${res.status} while saving`);
      return { sha: ((await res.json()) as any).commit.sha as string };
    },
    async history(file, limit = 15) {
      assertContentPath(file);
      const res = await api(`/commits?sha=${encodeURIComponent(opts.branch)}&path=${encodeURIComponent(file)}&per_page=${limit}`);
      if (!res.ok) throw new StoreError(`GitHub returned HTTP ${res.status} while reading history`);
      return ((await res.json()) as any[]).map((c) => ({ sha: c.sha, date: c.commit.committer.date, message: String(c.commit.message).split("\n")[0], author: c.commit.author?.name ?? "" }));
    },
    async readAt(file, sha) {
      assertContentPath(file);
      if (!/^[0-9a-f]{7,40}$/.test(sha)) throw new StoreError("invalid revision");
      const res = await api(`/contents/${enc(file)}?ref=${sha}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new StoreError(`GitHub returned HTTP ${res.status} while reading an old version`);
      return Buffer.from(((await res.json()) as any).content, "base64").toString("utf8");
    },
  };
}

/** Local development store: files on disk, committed with git so history and rollback behave the same. */
export function fsStore(root: string): ContentStore {
  const git = (...args: string[]) => run("git", args, { cwd: root, timeout: 20000 });
  const abs = (p: string) => { assertContentPath(p); return path.join(root, p); };
  const shaOf = async (p: string) => { try { return (await git("hash-object", p)).stdout.trim(); } catch { return ""; } };
  return {
    mode: "fs",
    async list(dir) { try { return (await fs.readdir(abs(dir + "/x").replace(/\/x$/, ""), { withFileTypes: true })).filter((e) => e.isFile()).map((e) => e.name); } catch { return []; } },
    async read(file) {
      const full = abs(file);
      try { const content = await fs.readFile(full, "utf8"); return { path: file, content, sha: await shaOf(file) }; } catch { return null; }
    },
    async write(file, content, message, expectedSha) {
      const current = await this.read(file);
      if (expectedSha && current && current.sha !== expectedSha) throw new StoreConflict("This file changed since you opened it. Reload to see the newer version before saving.");
      await fs.mkdir(path.dirname(abs(file)), { recursive: true });
      await fs.writeFile(abs(file), content);
      await git("add", "--", file);
      await git("-c", "user.name=Studio", "-c", "user.email=studio@localhost", "commit", "-m", message, "--only", "--", file);
      return { sha: (await git("rev-parse", "HEAD")).stdout.trim() };
    },
    async history(file, limit = 15) {
      assertContentPath(file);
      try {
        const out = (await git("log", `-n${limit}`, "--format=%H%x1f%cI%x1f%s%x1f%an", "--", file)).stdout.trim();
        return out ? out.split("\n").map((l) => { const [sha, date, message, author] = l.split("\x1f"); return { sha, date, message, author }; }) : [];
      } catch { return []; }
    },
    async readAt(file, sha) {
      assertContentPath(file);
      if (!/^[0-9a-f]{7,40}$/.test(sha)) throw new StoreError("invalid revision");
      try { return (await git("show", `${sha}:${file}`)).stdout; } catch { return null; }
    },
  };
}

export type StoreConfig = { store: ContentStore | null; reason?: string };

export function configuredStore(env: NodeJS.ProcessEnv = process.env): StoreConfig {
  if (env.STUDIO_STORAGE === "fs") {
    if (env.NODE_ENV === "production") return { store: null, reason: "Local file storage is only allowed outside production." };
    return { store: fsStore(env.STUDIO_FS_ROOT || process.cwd()) };
  }
  const token = env.STUDIO_GITHUB_TOKEN?.trim();
  if (!token) return { store: null, reason: "STUDIO_GITHUB_TOKEN is not set." };
  return { store: githubStore({ token, repo: env.STUDIO_GITHUB_REPO || "mosrvs2025/mauricegarcia.com", branch: env.STUDIO_GITHUB_BRANCH || "main" }) };
}
