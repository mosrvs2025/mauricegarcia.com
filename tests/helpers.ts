import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { GitHubClient, Release, Pull, Commit, DirEntry } from "../lib/sync/github";
import { projectSchema, sourceSchema, type Project, type Source } from "../lib/content/schemas";

export const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "mg-content-"));

export const project = (over: Partial<Record<string, unknown>> = {}): Project => projectSchema.parse({
  id: "prj-demo", slug: "demo", title: "Demo", tagline: "t", status: "published", visibility: "public", tier: "featured", themes: ["games"],
  maturity: "prototype", track: "labs", disclosure: { basis: "public-source", note: "test" }, problem: "p", audience: "a", contribution: "c", worksToday: [], limitations: [], links: { other: [] }, repoVisibility: "public",
  ai: { assisted: "unknown" }, dates: { reviewed: "2026-10-29" }, evidence: [{ label: "x", url: "https://github.com/o/r", kind: "source" }],
  involve: { headline: "h", asks: ["a"], intent: "hello" }, ...over,
});

export const source = (over: Partial<Record<string, unknown>> = {}): Source => sourceSchema.parse({
  id: "src-demo", repo: "o/r", projectId: "prj-demo", visibility: "public", branch: "dev", enabled: true,
  include: { releases: true, mergedPullRequests: true, websiteUpdateFiles: true, commitDigest: false }, autoPublish: false, ...over,
});

export type FakeData = { releases: Release[]; pulls: Pull[]; commits: Commit[]; files: Record<string, string>; releaseTags: Record<string, Release>; mergedPulls: Record<number, Pull>; fail?: string };
export function fakeClient(d: Partial<FakeData> = {}): GitHubClient & { data: FakeData; calls: string[] } {
  const data: FakeData = { releases: [], pulls: [], commits: [], files: {}, releaseTags: {}, mergedPulls: {}, ...d };
  const calls: string[] = [];
  const guard = () => { if (data.fail) throw new Error(data.fail); };
  return {
    data, calls,
    async releases() { calls.push("releases"); guard(); return data.releases; },
    async releaseByTag(_r, tag) { guard(); return data.releaseTags[tag] ?? null; },
    async mergedPulls(_r, branch, since) { calls.push("pulls:" + branch); guard(); return data.pulls.filter((p) => p.mergedAt && p.mergedAt >= since); },
    async pull(_r, n) { guard(); return data.mergedPulls[n] ?? null; },
    async commits() { guard(); return data.commits; },
    async listDir(_r, p): Promise<DirEntry[]> { guard(); return Object.keys(data.files).filter((f) => f.startsWith(p + "/")).map((f) => ({ name: f.split("/").pop()!, path: f, size: Buffer.byteLength(data.files[f]) })); },
    async file(_r, p) { guard(); return data.files[p] ?? null; },
  };
}

export const cand = (over: Record<string, unknown> = {}) => ({
  schemaVersion: 1, projectId: "prj-demo", eventId: "evt-1", eventAt: "2026-10-20T10:00:00Z", title: "Added saving", summary: "Saves now work.",
  changed: "Added local saving.", whyCare: "You won't lose progress.", status: "shipped", state: "draft", publicSafe: true,
  completion: { kind: "none", verified: false }, ...over,
});
