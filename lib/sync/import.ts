import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  candidateSchema, syncStatusSchema, updateSchema, NEEDS_REVIEW,
  type Candidate, type Project, type Source, type SyncStatus, type Update,
} from "../content/schemas";
import { createGitHubClient, type GitHubClient } from "./github";
import { decidePublication } from "./rule";
import { evidenceKind, fileStem, firstParagraph, sanitizeText, slugify, validEvidenceUrl } from "./sanitize";

/** Agent handoff location inside a source repository. */
export const WEBSITE_UPDATE_DIR = ".website/updates";
const MARKER = /^\s*website-update:\s*public-safe\s*$/im;
const BOT_COMMIT = /\[site-sync\]|\[skip site\]/i;
const MAX_FILE_BYTES = 8 * 1024;
const MAX_FILES_PER_SOURCE = 50;

export type SourceResult = { sourceId: string; ok: boolean; error: string | null; imported: number; unchanged: number; rejected: string[] };
export type SyncSummary = { results: SourceResult[]; promoted: { created: number; refreshed: number; skipped: number }; statusWritten: boolean; fatal?: string };

const hashOf = (c: Omit<Candidate, "provenance">) => crypto.createHash("sha256").update(JSON.stringify([c.projectId, c.eventId, c.eventAt, c.title, c.summary, c.changed, c.whyCare, c.status, c.limitations ?? "", c.evidenceUrl ?? "", c.state, c.publicSafe, c.completion])).digest("hex").slice(0, 32);

function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmp, file); // atomic: a crash never leaves a half-written file
}
const readJson = <T>(file: string): T | null => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; } };

/** Parse and re-sanitize an explicit website-update file. Everything in it is untrusted. */
export function candidateFromFile(raw: string, source: Source): { candidate?: Candidate; reject?: string } {
  if (Buffer.byteLength(raw) > MAX_FILE_BYTES) return { reject: "file is larger than 8 KB" };
  let json: any;
  try { json = JSON.parse(raw); } catch { return { reject: "not valid JSON" }; }
  const parsed = candidateSchema.safeParse(json);
  if (!parsed.success) return { reject: "does not match the candidate schema: " + parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ") };
  const c = parsed.data;
  if (c.projectId !== source.projectId) return { reject: `projectId ${c.projectId} does not belong to this source` };
  if (!c.publicSafe) return { reject: "not marked publicSafe, so it was not imported" };
  const clean: Omit<Candidate, "provenance"> = {
    ...c,
    title: sanitizeText(c.title, 100), summary: sanitizeText(c.summary, 400), changed: sanitizeText(c.changed, 400),
    whyCare: sanitizeText(c.whyCare, 300), limitations: c.limitations ? sanitizeText(c.limitations, 300) : undefined,
    evidenceUrl: validEvidenceUrl(c.evidenceUrl, source.repo),
    // A file can only claim completion; the sync verifies it. Never trust the claim.
    completion: { kind: c.completion.kind, verified: false },
  };
  if (!clean.title || !clean.summary || !clean.changed || !clean.whyCare) return { reject: "text was empty after sanitising" };
  return { candidate: { ...clean, provenance: { origin: "agent", agent: c.provenance?.agent ? sanitizeText(c.provenance.agent, 80) : undefined } } };
}

async function verifyCompletion(c: Candidate, source: Source, client: GitHubClient): Promise<Candidate> {
  if (!c.evidenceUrl || c.completion.kind === "none") return c;
  const rel = /\/releases\/tag\/([^/?#]+)$/.exec(c.evidenceUrl);
  const pr = /\/pull\/(\d+)$/.exec(c.evidenceUrl);
  let verified = false;
  if (c.completion.kind === "release" && rel) {
    const r = await client.releaseByTag(source.repo, decodeURIComponent(rel[1]));
    verified = !!r && !r.draft && !r.prerelease && !!r.publishedAt;
  } else if (c.completion.kind === "merged-pull-request" && pr) {
    const p = await client.pull(source.repo, Number(pr[1]));
    verified = !!p?.mergedAt;
  }
  return { ...c, completion: { ...c.completion, verified } };
}

function windowOf(iso: string, hours: number): { start: string; end: string } {
  const ms = hours * 3600_000; const t = Date.parse(iso);
  const s = Math.floor(t / ms) * ms;
  return { start: new Date(s).toISOString(), end: new Date(s + ms).toISOString() };
}

async function collect(source: Source, client: GitHubClient, now: Date, projectTitle: string, lookbackDays: number, rejected: string[]): Promise<Candidate[]> {
  const out: Candidate[] = [];
  const since = new Date(now.getTime() - lookbackDays * 86400_000).toISOString();

  if (source.include.websiteUpdateFiles) {
    const entries = (await client.listDir(source.repo, WEBSITE_UPDATE_DIR, source.branch)).filter((e) => e.name.endsWith(".json")).slice(0, MAX_FILES_PER_SOURCE);
    for (const e of entries) {
      if (e.size > MAX_FILE_BYTES) { rejected.push(`${e.name}: file is larger than 8 KB`); continue; }
      const raw = await client.file(source.repo, e.path, source.branch);
      if (raw === null) continue;
      const { candidate, reject } = candidateFromFile(raw, source);
      if (reject || !candidate) { rejected.push(`${e.name}: ${reject}`); continue; }
      out.push(await verifyCompletion(candidate, source, client));
    }
  }

  if (source.include.releases) {
    for (const r of await client.releases(source.repo)) {
      if (r.draft || r.prerelease || !r.publishedAt || r.publishedAt < since) continue;
      const marked = MARKER.test(r.body);
      const summary = sanitizeText(firstParagraph(r.body.replace(MARKER, "")), 400) || `Release ${sanitizeText(r.tag, 40)}.`;
      const url = validEvidenceUrl(r.url, source.repo);
      if (!url) continue;
      out.push({
        schemaVersion: 1, projectId: source.projectId, eventId: `release:${source.repo.replace("/", "_")}:${r.id}`, eventAt: new Date(r.publishedAt).toISOString(),
        title: sanitizeText(r.name || `${projectTitle} ${r.tag}`, 100), summary, changed: summary,
        whyCare: marked ? `A new version, ${sanitizeText(r.tag, 40)}, is out. The release notes link to the details.` : `${NEEDS_REVIEW} Say why this release matters to a visitor.`,
        status: "shipped", evidenceUrl: url,
        // Only an explicitly marked release can ask to publish; the rule still decides.
        state: marked ? "publish" : "draft", publicSafe: marked,
        completion: { kind: "release", verified: true }, provenance: { origin: "sync" },
      });
    }
  }

  // Noisy changes are batched into one note per closed window.
  const windows = new Map<string, { start: string; end: string; pulls: string[]; commits: string[] }>();
  const nowIso = now.toISOString();
  const bucket = (iso: string) => { const w = windowOf(iso, source.batchWindowHours); if (w.end > nowIso) return null; return windows.get(w.start) ?? (windows.set(w.start, { ...w, pulls: [], commits: [] }), windows.get(w.start)!); };
  if (source.include.mergedPullRequests) {
    for (const p of await client.mergedPulls(source.repo, source.branch, since)) bucket(p.mergedAt!)?.pulls.push(sanitizeText(p.title, 80));
  }
  if (source.include.commitDigest) {
    for (const c of await client.commits(source.repo, source.branch, since)) {
      const first = c.message.split("\n")[0];
      if (BOT_COMMIT.test(c.message) || /\[bot\]$/.test(c.author) || /^Merge (pull request|branch)/.test(first)) continue;
      bucket(c.date)?.commits.push(sanitizeText(first, 80));
    }
  }
  for (const w of windows.values()) {
    const items = w.pulls.length ? w.pulls : w.commits;
    if (!items.length) continue;
    const kind = w.pulls.length ? "merged pull request" : "commit";
    const d1 = w.start.slice(0, 10); const d2 = new Date(Date.parse(w.end) - 1).toISOString().slice(0, 10);
    const list = items.filter(Boolean).slice(0, 5).join("; ");
    out.push({
      schemaVersion: 1, projectId: source.projectId, eventId: `digest:${source.id}:${d1}`, eventAt: new Date(Date.parse(w.end) - 1000).toISOString(),
      title: `${projectTitle}: ${items.length} ${kind}${items.length === 1 ? "" : "s"}, ${d1} to ${d2}`,
      summary: `${items.length} ${kind}${items.length === 1 ? " was" : "s were"} completed between ${d1} and ${d2}.`,
      changed: list || "Details are in the repository.",
      whyCare: `${NEEDS_REVIEW} Say what a visitor can now do or see that they couldn't before.`,
      status: "in-progress", state: "draft", publicSafe: true,
      completion: { kind: "none", verified: false }, provenance: { origin: "sync" },
    });
  }
  return out;
}

export type SyncOptions = {
  contentDir: string; sources: Source[]; projects: Project[]; now?: Date;
  client?: GitHubClient; token?: string; lookbackDays?: number; log?: (m: string) => void;
};

/** Writes candidates for each source independently. A failing source leaves its existing files untouched. */
export async function runSync(opts: SyncOptions): Promise<SyncSummary> {
  const now = opts.now ?? new Date(); const nowIso = now.toISOString(); const log = opts.log ?? (() => {});
  const client = opts.client ?? createGitHubClient(opts.token);
  const statusFile = path.join(opts.contentDir, "sync-status.json");
  const prev = readJson<SyncStatus>(statusFile);
  const status: SyncStatus = { lastAttemptAt: nowIso, lastSuccessAt: prev?.lastSuccessAt ?? null, sources: { ...(prev?.sources ?? {}) } };
  const results: SourceResult[] = [];

  for (const source of opts.sources) {
    if (!source.enabled) continue;
    const r: SourceResult = { sourceId: source.id, ok: false, error: null, imported: 0, unchanged: 0, rejected: [] };
    results.push(r);
    if (source.visibility === "private") {
      // The site repository is public: private-derived text must never be committed here before review.
      r.ok = true;
      r.error = "skipped: private sources are not synced into a public repository; write the public summary by hand in the studio";
      continue;
    }
    try {
      const title = opts.projects.find((p) => p.id === source.projectId)?.title ?? source.projectId;
      const candidates = await collect(source, client, now, title, opts.lookbackDays ?? 30, r.rejected);
      const seen = new Set<string>();
      for (const c of candidates) {
        if (seen.has(c.eventId)) { r.rejected.push(`${c.eventId}: duplicate event id in one run`); continue; }
        seen.add(c.eventId);
        const file = path.join(opts.contentDir, "candidates", c.projectId, `${fileStem(c.eventId)}.json`);
        const hash = hashOf(c);
        const existing = readJson<Candidate>(file);
        if (existing?.provenance?.contentHash === hash) { r.unchanged++; continue; }
        const record = candidateSchema.parse({ ...c, provenance: { ...c.provenance, importedAt: nowIso, contentHash: hash } });
        writeJson(file, record); r.imported++;
      }
      r.ok = true;
      log(`${source.id}: ${r.imported} imported, ${r.unchanged} unchanged${r.rejected.length ? `, ${r.rejected.length} rejected` : ""}`);
    } catch (e) {
      r.error = (e as Error).message.replace(/(ghp|github_pat|ghs)_[A-Za-z0-9_]+/g, "[redacted]").slice(0, 400);
      log(`${source.id}: FAILED (${r.error}). Existing content is untouched.`);
    }
  }

  for (const r of results) {
    const before = status.sources[r.sourceId];
    status.sources[r.sourceId] = {
      lastAttemptAt: nowIso, lastSuccessAt: r.ok ? nowIso : before?.lastSuccessAt ?? null, lastError: r.error,
      imported: r.ok ? r.imported : before?.imported ?? 0, unchanged: r.ok ? r.unchanged : before?.unchanged ?? 0,
    };
  }
  if (results.length && results.every((r) => r.ok)) status.lastSuccessAt = nowIso;

  const promoted = promoteAll(opts, now);

  // Only touch the status file when something worth a commit changed, so a quiet sync makes no commit.
  const significant = results.some((r) => r.imported > 0) || JSON.stringify(errorsOf(prev)) !== JSON.stringify(errorsOf(status)) || !prev || promoted.created + promoted.refreshed > 0;
  if (significant) writeJson(statusFile, syncStatusSchema.parse(status));
  return { results, promoted, statusWritten: significant };
}

const errorsOf = (s: SyncStatus | null) => Object.entries(s?.sources ?? {}).map(([k, v]) => [k, v.lastError]).sort();

export function updateIdFor(eventId: string): string { return "upd-" + crypto.createHash("sha1").update(eventId).digest("hex").slice(0, 12); }

export type PromoteOutcome = { action: "create" | "refresh" | "skip"; update?: Update; reason?: string };

/** Pure: turns one candidate into a draft or published update, never touching owner-edited or already-live entries. */
export function promoteCandidate(c: Candidate, source: Source, project: Project | undefined, existing: Update[], now: Date): PromoteOutcome {
  const id = updateIdFor(c.eventId);
  const found = existing.find((u) => u.id === id || u.provenance.eventId === c.eventId);
  if (found) {
    if (found.provenance.editedByOwner) return { action: "skip", reason: "edited by the owner" };
    if (found.status !== "draft") return { action: "skip", reason: `already ${found.status}` };
  }
  const decision = decidePublication(c, source, project);
  const evidence = c.evidenceUrl ? [{ label: c.completion.kind === "release" ? "The release" : c.completion.kind === "merged-pull-request" ? "The pull request" : "Source", url: c.evidenceUrl, kind: evidenceKind(c.evidenceUrl) }] : [];
  const day = c.eventAt.slice(0, 10);
  let slug = found?.slug ?? `${day}-${slugify(c.title, 56)}`;
  if (!found && existing.some((u) => u.slug === slug)) slug = `${slug}-${id.slice(4, 8)}`;
  const update: Update = updateSchema.parse({
    id, slug, title: c.title, summary: c.summary, whyCare: c.whyCare, limitations: c.limitations,
    body: c.changed !== c.summary ? c.changed : undefined,
    kind: c.completion.kind === "release" ? "release" : "progress", projectId: c.projectId,
    status: decision.publish ? "published" : "draft", visibility: "public", eventAt: c.eventAt,
    publishedAt: decision.publish ? now.toISOString() : undefined, tags: [], evidence,
    provenance: { origin: c.provenance.origin === "agent" ? "agent" : "sync", sourceId: source.id, eventId: c.eventId, importedAt: c.provenance.importedAt },
  });
  return { action: found ? "refresh" : "create", update };
}

export function promoteAll(opts: Pick<SyncOptions, "contentDir" | "sources" | "projects">, now: Date) {
  const tally = { created: 0, refreshed: 0, skipped: 0 };
  const candDir = path.join(opts.contentDir, "candidates"); const updDir = path.join(opts.contentDir, "updates");
  if (!fs.existsSync(candDir)) return tally;
  const existing: Update[] = fs.existsSync(updDir) ? fs.readdirSync(updDir).filter((f) => f.endsWith(".json")).map((f) => readJson<Update>(path.join(updDir, f))).filter((u): u is Update => !!u) : [];
  for (const proj of fs.readdirSync(candDir)) {
    for (const f of fs.readdirSync(path.join(candDir, proj)).filter((x) => x.endsWith(".json"))) {
      const c = candidateSchema.safeParse(readJson(path.join(candDir, proj, f)));
      if (!c.success) { tally.skipped++; continue; }
      const source = opts.sources.find((s) => s.projectId === c.data.projectId && s.enabled && s.visibility === "public");
      if (!source) { tally.skipped++; continue; }
      const out = promoteCandidate(c.data, source, opts.projects.find((p) => p.id === c.data.projectId), existing, now);
      if (out.action === "skip" || !out.update) { tally.skipped++; continue; }
      const file = path.join(updDir, `${out.update.id}.json`);
      const prev = readJson<Update>(file);
      if (prev && JSON.stringify(prev) === JSON.stringify(out.update)) { tally.skipped++; continue; }
      writeJson(file, out.update);
      const i = existing.findIndex((u) => u.id === out.update!.id); if (i >= 0) existing[i] = out.update; else existing.push(out.update);
      out.action === "create" ? tally.created++ : tally.refreshed++;
    }
  }
  return tally;
}
