import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import {
  candidateSchema, nowSchema, postFrontmatterSchema, projectSchema, sourcesFileSchema, syncStatusSchema, updateSchema,
  type Candidate, type Now, type Post, type Project, type Source, type SyncStatus, type Update,
} from "./schemas";
import { readingMinutes } from "./markdown";

export const CONTENT_DIR = process.env.CONTENT_DIR || path.join(process.cwd(), "content");

export class ContentError extends Error {}

function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, value: unknown, file: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    throw new ContentError(`Invalid content in ${path.relative(process.cwd(), file)}\n${issues}`);
  }
  return result.data;
}

function files(dir: string, ext: string): string[] {
  const full = path.join(CONTENT_DIR, dir);
  if (!fs.existsSync(full)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const p = path.join(full, entry.name);
    if (entry.isDirectory()) out.push(...files(path.join(dir, entry.name), ext));
    else if (entry.name.endsWith(ext)) out.push(p);
  }
  return out.sort();
}

const readJson = (file: string): unknown => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { throw new ContentError(`Cannot parse ${path.relative(process.cwd(), file)}: ${(e as Error).message}`); }
};

function assertUnique(items: { id: string; slug?: string }[], label: string) {
  const ids = new Set<string>(); const slugs = new Set<string>();
  for (const i of items) {
    if (ids.has(i.id)) throw new ContentError(`Duplicate ${label} id: ${i.id}`);
    ids.add(i.id);
    if (i.slug) { if (slugs.has(i.slug)) throw new ContentError(`Duplicate ${label} slug: ${i.slug}`); slugs.add(i.slug); }
  }
}

export function parsePostFile(raw: string, file = "post.md"): Post {
  const { data, content } = matter(raw);
  const fm = parse(postFrontmatterSchema, data, file);
  return { ...fm, body: content.trim(), readingMinutes: readingMinutes(content) };
}

export function loadProjects(): Project[] {
  const list = files("projects", ".json").map((f) => parse(projectSchema, readJson(f), f));
  assertUnique(list, "project");
  return list.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function loadUpdates(): Update[] {
  const list = files("updates", ".json").map((f) => parse(updateSchema, readJson(f), f));
  assertUnique(list, "update");
  return list.sort((a, b) => b.eventAt.localeCompare(a.eventAt));
}

export function loadPosts(): Post[] {
  const list = files("posts", ".md").map((f) => parsePostFile(fs.readFileSync(f, "utf8"), f));
  assertUnique(list, "post");
  return list.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
}

export function loadNow(): Now | null {
  const f = path.join(CONTENT_DIR, "now.json");
  return fs.existsSync(f) ? parse(nowSchema, readJson(f), f) : null;
}

export function loadSources(): Source[] {
  const f = path.join(CONTENT_DIR, "sources.json");
  if (!fs.existsSync(f)) return [];
  return parse(sourcesFileSchema, readJson(f), f).sources;
}

export function loadCandidates(): Candidate[] {
  return files("candidates", ".json").map((f) => parse(candidateSchema, readJson(f), f));
}

export function loadSyncStatus(): SyncStatus | null {
  const f = path.join(CONTENT_DIR, "sync-status.json");
  return fs.existsSync(f) ? parse(syncStatusSchema, readJson(f), f) : null;
}

/** Cross-file integrity: references resolve, sources match projects. */
export function validateAll(): string[] {
  const problems: string[] = [];
  const projects = loadProjects(); const updates = loadUpdates(); const posts = loadPosts();
  loadNow(); loadCandidates(); loadSyncStatus();
  const sources = loadSources();
  const projectIds = new Set(projects.map((p) => p.id));
  const sourceIds = new Set(sources.map((s) => s.id));
  for (const u of updates) if (u.projectId && !projectIds.has(u.projectId)) problems.push(`update ${u.id}: unknown projectId ${u.projectId}`);
  for (const p of posts) for (const id of p.projectIds) if (!projectIds.has(id)) problems.push(`post ${p.id}: unknown projectId ${id}`);
  for (const s of sources) if (!projectIds.has(s.projectId)) problems.push(`source ${s.id}: unknown projectId ${s.projectId}`);
  for (const p of projects) if (p.sourceId && !sourceIds.has(p.sourceId)) problems.push(`project ${p.id}: unknown sourceId ${p.sourceId}`);
  const slugs = new Map<string, string>();
  for (const p of projects) for (const s of [p.slug, ...p.formerSlugs]) {
    if (slugs.has(s) && slugs.get(s) !== p.id) problems.push(`project slug ${s} used by ${slugs.get(s)} and ${p.id}`);
    slugs.set(s, p.id);
  }
  return problems;
}
