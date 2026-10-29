export type Release = { id: number; tag: string; name: string; body: string; url: string; publishedAt: string | null; draft: boolean; prerelease: boolean };
export type Pull = { number: number; title: string; url: string; mergedAt: string | null; author: string };
export type Commit = { sha: string; message: string; url: string; date: string; author: string };
export type DirEntry = { name: string; path: string; size: number };

export class UpstreamError extends Error {}

export interface GitHubClient {
  releases(repo: string): Promise<Release[]>;
  releaseByTag(repo: string, tag: string): Promise<Release | null>;
  mergedPulls(repo: string, branch: string, sinceIso: string): Promise<Pull[]>;
  pull(repo: string, number: number): Promise<Pull | null>;
  commits(repo: string, branch: string, sinceIso: string): Promise<Commit[]>;
  listDir(repo: string, path: string, ref: string): Promise<DirEntry[]>;
  file(repo: string, path: string, ref: string): Promise<string | null>;
}

const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

/** Read-only GitHub REST client. The token goes only to api.github.com and never into output. */
export function createGitHubClient(token: string | undefined, fetchImpl: typeof fetch = fetch): GitHubClient {
  async function get(path: string, allow404 = false): Promise<unknown> {
    const res = await fetchImpl(`https://api.github.com${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "mauricegarcia-site-sync",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404 && allow404) return null;
    if (res.status === 403 || res.status === 429) {
      const reset = res.headers.get("x-ratelimit-reset");
      throw new UpstreamError(`GitHub refused the request (HTTP ${res.status})${res.headers.get("x-ratelimit-remaining") === "0" && reset ? `; rate limit resets at ${new Date(Number(reset) * 1000).toISOString()}` : "; check that the token has read access to this repository"}`);
    }
    if (res.status === 401) throw new UpstreamError("GitHub rejected the token (HTTP 401): it may be expired or revoked");
    if (!res.ok) throw new UpstreamError(`GitHub returned HTTP ${res.status}`);
    return res.json();
  }
  const guard = (repo: string) => { if (!REPO_RE.test(repo)) throw new UpstreamError("invalid repository name"); };
  const enc = (p: string) => p.split("/").map(encodeURIComponent).join("/");
  const rel = (r: any): Release => ({ id: r.id, tag: String(r.tag_name), name: String(r.name || ""), body: String(r.body || ""), url: String(r.html_url), publishedAt: r.published_at ?? null, draft: !!r.draft, prerelease: !!r.prerelease });
  const pull = (p: any): Pull => ({ number: p.number, title: String(p.title || ""), url: String(p.html_url), mergedAt: p.merged_at ?? null, author: String(p.user?.login || "") });

  return {
    async releases(repo) { guard(repo); return ((await get(`/repos/${repo}/releases?per_page=30`)) as any[]).map(rel); },
    async releaseByTag(repo, tag) { guard(repo); const r = await get(`/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`, true); return r ? rel(r) : null; },
    async mergedPulls(repo, branch, since) {
      guard(repo);
      const list = (await get(`/repos/${repo}/pulls?state=closed&base=${encodeURIComponent(branch)}&sort=updated&direction=desc&per_page=100`)) as any[];
      return list.map(pull).filter((p) => p.mergedAt && p.mergedAt >= since);
    },
    async pull(repo, n) { guard(repo); const p = await get(`/repos/${repo}/pulls/${n}`, true); return p ? pull(p) : null; },
    async commits(repo, branch, since) {
      guard(repo);
      const list = (await get(`/repos/${repo}/commits?sha=${encodeURIComponent(branch)}&since=${encodeURIComponent(since)}&per_page=100`)) as any[];
      return list.map((c) => ({ sha: c.sha, message: String(c.commit?.message || ""), url: String(c.html_url), date: String(c.commit?.committer?.date || ""), author: String(c.author?.login || c.commit?.author?.name || "") }));
    },
    async listDir(repo, path, ref) {
      guard(repo);
      const r = await get(`/repos/${repo}/contents/${enc(path)}?ref=${encodeURIComponent(ref)}`, true);
      return Array.isArray(r) ? r.filter((e: any) => e.type === "file").map((e: any) => ({ name: e.name, path: e.path, size: e.size })) : [];
    },
    async file(repo, path, ref) {
      guard(repo);
      const r = (await get(`/repos/${repo}/contents/${enc(path)}?ref=${encodeURIComponent(ref)}`, true)) as any;
      if (!r || Array.isArray(r) || r.encoding !== "base64") return null;
      return Buffer.from(r.content, "base64").toString("utf8");
    },
  };
}
