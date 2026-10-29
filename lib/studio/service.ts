import matter from "gray-matter";
import { z } from "zod";
import {
  nowSchema, postFrontmatterSchema, projectSchema, updateSchema,
  type Now, type PostFrontmatter, type Update,
} from "../content/schemas";
import { parsePostFile } from "../content/load";
import { slugify } from "../sync/sanitize";
import { StoreError, type ContentStore, type HistoryEntry } from "./store";

export type ItemType = "update" | "post" | "now";
export const ITEM_TYPES: ItemType[] = ["update", "post", "now"];

export class ValidationFailed extends Error { constructor(public issues: string[]) { super(issues.join("; ")); } }

const issuesOf = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);

export const pathFor = (type: ItemType, id: string, slug?: string): string => {
  if (!/^[A-Za-z0-9._-]+$/.test(id)) throw new StoreError("invalid id");
  if (type === "now") return "content/now.json";
  if (type === "update") return `content/updates/${id}.json`;
  return `content/posts/${slug ?? id}.md`;
};

export type PostDoc = PostFrontmatter & { body: string };
export type Doc = Update | PostDoc | Now;

export function serialize(type: ItemType, doc: Doc): string {
  if (type === "post") {
    const { body, ...fm } = doc as PostDoc;
    const clean = JSON.parse(JSON.stringify(fm));
    return matter.stringify(body.trim() + "\n", clean);
  }
  return JSON.stringify(doc, null, 2) + "\n";
}

/** The same schemas the build uses. Anything that passes here will pass `npm run content:validate`. */
export function validate(type: ItemType, doc: unknown): Doc {
  if (type === "update") { const r = updateSchema.safeParse(doc); if (!r.success) throw new ValidationFailed(issuesOf(r.error)); return r.data; }
  if (type === "now") { const r = nowSchema.safeParse(doc); if (!r.success) throw new ValidationFailed(issuesOf(r.error)); return r.data; }
  const { body, ...fm } = (doc ?? {}) as PostDoc;
  const r = postFrontmatterSchema.safeParse(fm); if (!r.success) throw new ValidationFailed(issuesOf(r.error));
  if (typeof body !== "string" || !body.trim()) throw new ValidationFailed(["body: a post needs text"]);
  if (body.length > 60000) throw new ValidationFailed(["body: too long"]);
  return { ...r.data, body };
}

export function parseStored(type: ItemType, content: string): Doc {
  if (type === "post") { const p = parsePostFile(content); const { readingMinutes: _r, ...rest } = p; return rest; }
  return validate(type, JSON.parse(content));
}

export type ListEntry = { type: ItemType | "project" | "candidate"; id: string; title: string; status: string; visibility: string; date: string; path: string; slug?: string; origin?: string };

export async function listAll(store: ContentStore): Promise<ListEntry[]> {
  const out: ListEntry[] = [];
  const collect = async (dir: string, ext: string, fn: (name: string, content: string) => ListEntry | null) => {
    for (const name of (await store.list(dir)).filter((n) => n.endsWith(ext))) {
      const f = await store.read(`${dir}/${name}`); if (!f) continue;
      try { const e = fn(name, f.content); if (e) out.push(e); } catch { out.push({ type: "update", id: name, title: `${name} (invalid, see validation)`, status: "invalid", visibility: "-", date: "", path: `${dir}/${name}` }); }
    }
  };
  await collect("content/updates", ".json", (n, c) => { const u = updateSchema.parse(JSON.parse(c)); return { type: "update", id: u.id, slug: u.slug, title: u.title, status: u.status, visibility: u.visibility, date: u.eventAt.slice(0, 10), path: `content/updates/${n}`, origin: u.provenance.origin }; });
  await collect("content/posts", ".md", (n, c) => { const p = parsePostFile(c); return { type: "post", id: p.id, slug: p.slug, title: p.title, status: p.status, visibility: p.visibility, date: (p.publishedAt ?? "").slice(0, 10), path: `content/posts/${n}` }; });
  await collect("content/projects", ".json", (n, c) => { const p = projectSchema.parse(JSON.parse(c)); return { type: "project", id: p.id, slug: p.slug, title: p.title, status: p.status, visibility: p.visibility, date: p.dates.reviewed, path: `content/projects/${n}` }; });
  const now = await store.read("content/now.json");
  if (now) { const n = nowSchema.parse(JSON.parse(now.content)); out.push({ type: "now", id: "now", title: "Now", status: n.status, visibility: n.visibility, date: n.reviewedAt, path: "content/now.json" }); }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getItem(store: ContentStore, type: ItemType, id: string, slug?: string): Promise<{ doc: Doc; sha: string; path: string } | null> {
  let path = pathFor(type, id, slug);
  if (type === "post" && !slug) {
    // posts are stored by slug; resolve id → file
    const hit = (await listAll(store)).find((e) => e.type === "post" && (e.id === id || e.slug === id));
    if (!hit) return null; path = hit.path;
  }
  const f = await store.read(path); if (!f) return null;
  return { doc: parseStored(type, f.content), sha: f.sha, path };
}

async function refCheck(store: ContentStore, type: ItemType, doc: Doc) {
  const ids = (doc as Update).projectId ? [(doc as Update).projectId!] : (doc as PostDoc).projectIds ?? [];
  if (!ids.length) return;
  const known = new Set<string>();
  for (const n of await store.list("content/projects")) { const f = await store.read(`content/projects/${n}`); if (f) try { known.add(projectSchema.parse(JSON.parse(f.content)).id); } catch {} }
  const bad = ids.filter((i) => !known.has(i));
  if (bad.length) throw new ValidationFailed([`unknown project: ${bad.join(", ")}`]);
}

export type SaveInput = { type: ItemType; doc: unknown; expectedSha?: string; message?: string };

/** Validate, then commit. Owner edits mark updates so no sync may overwrite them. */
export async function saveItem(store: ContentStore, input: SaveInput, now = new Date()): Promise<{ path: string; sha: string; commit: string }> {
  // Editorial date is stamped before validation, so "publish" works on a draft that has no date yet.
  const raw = { ...(input.doc as Record<string, unknown>) };
  if ((input.type === "update" || input.type === "post") && raw.status === "published" && !raw.publishedAt) raw.publishedAt = now.toISOString();
  let doc = validate(input.type, raw);
  if (input.type === "update") {
    const u = doc as Update;
    doc = { ...u, provenance: { ...u.provenance, editedByOwner: true, reviewedAt: now.toISOString() } };
  }
  if (input.type === "post") {
    const p = doc as PostDoc;
    if (p.status === "published") doc = { ...p, publishedAt: p.publishedAt ?? now.toISOString(), updatedAt: p.publishedAt ? now.toISOString() : p.updatedAt };
  }
  if (input.type === "now") doc = { ...(doc as Now), reviewedBy: "owner" };
  doc = validate(input.type, doc); // re-validate the final shape
  await refCheck(store, input.type, doc);
  const id = (doc as { id: string }).id;
  const path = pathFor(input.type, id, (doc as PostDoc).slug);
  const verb = input.type === "now" ? "update" : (doc as { status: string }).status === "published" ? "publish" : "save draft";
  const { sha } = await store.write(path, serialize(input.type, doc), input.message ?? `studio: ${verb} ${input.type} ${id}`, input.expectedSha);
  return { path, sha: (await store.read(path))?.sha ?? "", commit: sha };
}

export async function setStatus(store: ContentStore, type: ItemType, id: string, to: "published" | "draft", now = new Date()) {
  const cur = await getItem(store, type, id); if (!cur) throw new StoreError("not found");
  const doc = { ...(cur.doc as any), status: to };
  if (to === "published") doc.publishedAt = doc.publishedAt ?? now.toISOString();
  return saveItem(store, { type, doc, expectedSha: cur.sha, message: `studio: ${to === "published" ? "publish" : "unpublish"} ${type} ${id}` }, now);
}

export async function historyOf(store: ContentStore, path: string): Promise<HistoryEntry[]> { return store.history(path); }

/** Rollback = write an earlier version as a new commit. History is never rewritten. */
export async function restoreVersion(store: ContentStore, type: ItemType, path: string, ref: string, now = new Date()) {
  const old = await store.readAt(path, ref);
  if (old === null) throw new StoreError("that version no longer exists");
  const doc = parseStored(type, old); // must still be valid under today's schema
  const cur = await store.read(path);
  return saveItem(store, { type, doc, expectedSha: cur?.sha, message: `studio: restore ${path} to ${ref.slice(0, 7)}` }, now);
}

export function newUpdateDoc(title: string, now = new Date()): Update {
  const day = now.toISOString().slice(0, 10);
  const id = `upd-${day.replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6)}`;
  return updateSchema.parse({
    id, slug: `${day}-${slugify(title, 56)}`, title, summary: "Add a one or two sentence summary.", kind: "progress",
    status: "draft", visibility: "public", eventAt: day, tags: [], evidence: [], provenance: { origin: "manual" },
  });
}
