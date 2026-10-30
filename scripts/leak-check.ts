import fs from "node:fs";
import path from "node:path";
import { loadLessons, loadPosts, loadProjects, loadSources, loadUpdates } from "../lib/content/load";
import { isListed, isShown } from "../lib/content/visibility";

/**
 * Scans a finished build and public/ for anything that must not be public: drafts,
 * unlisted items in lists/feeds, private sources, and any extra terms in LEAK_TERMS
 * (comma-separated, e.g. private repository names; keep that list out of Git).
 * Run it against a production-mode build: `NEXT_DIST_DIR=.next-prod npm run build`.
 */
const dist = process.env.NEXT_DIST_DIR || ".next";
const roots = [path.join(dist, "server", "app"), path.join(dist, "static"), "public"].filter((p) => fs.existsSync(p));
if (process.env.SITE_PREVIEW === "1") console.log("Note: SITE_PREVIEW=1 is set, so 'proposed' content is expected in this build and is not checked.");

type Term = { term: string; why: string; word: boolean };
const terms: Term[] = [];
const hidden = (i: { status: string; visibility: string }) => !isShown(i);
for (const p of loadProjects().filter(hidden)) terms.push({ term: p.slug, why: `project ${p.id} is not shown`, word: true }, { term: p.id, why: `project ${p.id}`, word: false }, { term: p.title, why: `project ${p.id} title`, word: true });
for (const u of loadUpdates().filter(hidden)) terms.push({ term: u.slug, why: `update ${u.id} is not shown`, word: false }, { term: u.id, why: `update ${u.id}`, word: false }, { term: u.title, why: `update ${u.id} title`, word: false });
for (const p of loadPosts().filter(hidden)) terms.push({ term: p.slug, why: `post ${p.id} is not shown`, word: false }, { term: p.title, why: `post ${p.id} title`, word: false });
for (const l of loadLessons().filter(hidden)) terms.push({ term: l.slug, why: `lesson ${l.id} is not shown`, word: false }, { term: l.title, why: `lesson ${l.id} title`, word: false });
for (const s of loadSources().filter((s) => s.visibility === "private")) terms.push({ term: s.repo, why: `private source ${s.id}`, word: false });
for (const t of (process.env.LEAK_TERMS || "").split(",").map((s) => s.trim()).filter((s) => s.length >= 4)) terms.push({ term: t, why: "LEAK_TERMS", word: true });
// Unlisted items may have a page but must not appear in lists, feeds or the sitemap.
const unlisted = [...loadProjects(), ...loadUpdates(), ...loadPosts(), ...loadLessons()].filter((i) => isShown(i) && !isListed(i));

// Public asset filenames must not carry hidden project names either (images, videos, posters).
const hiddenSlugs = loadProjects().filter(hidden).map((p) => p.slug);
const files = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hits: string[] = [];
const textExt = /\.(html|rsc|txt|xml|json|js|css|map|md|svg|webmanifest|meta|body)$/;
// Server-only artefacts (route code, file-trace manifests, studio pages) are never served to visitors.
const serverOnly = (f: string) => /\.nft\.json$/.test(f) || f.includes(`${path.sep}api${path.sep}`) || f.includes(`${path.sep}studio${path.sep}`) || /[\\/]studio\.(html|rsc|meta|segments)/.test(f);
for (const root of roots) for (const f of files(root)) {
  if (serverOnly(f)) continue;
  for (const slug of hiddenSlugs) if (path.basename(f).toLowerCase().includes(slug)) hits.push(`${f}: public file named for hidden project ${slug}`);
  if (!textExt.test(f) && path.extname(f) !== "") continue;
  const text = fs.readFileSync(f, "utf8");
  for (const t of terms) {
    if (t.term.length < 4) continue;
    const re = new RegExp(t.word ? `\\b${esc(t.term)}\\b` : esc(t.term), "i");
    if (re.test(text)) hits.push(`${f}: contains "${t.term}" (${t.why})`);
  }
  if (/sitemap|rss\.xml|\/updates\.html|\/projects\.html|\/writing\.html/.test(f)) for (const u of unlisted) if (text.includes(u.slug)) hits.push(`${f}: lists unlisted item ${u.slug}`);
}
if (hits.length) { console.error(`Leak check FAILED (${hits.length}):\n` + hits.slice(0, 40).join("\n")); process.exit(1); }
console.log(`Leak check passed: ${terms.length} terms across ${roots.join(", ")}.`);
