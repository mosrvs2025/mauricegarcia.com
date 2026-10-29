import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { CONTENT_DIR } from "../lib/content/load";

/**
 * Owner approval step: flips content from "proposed" to "published".
 *   npm run content:approve                 list what is waiting
 *   npm run content:approve -- --yes        publish everything proposed
 *   npm run content:approve -- --yes --only prj-gridheart,now
 * Publishing is a decision, so nothing changes without --yes.
 */
const args = process.argv.slice(2);
const yes = args.includes("--yes");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const nowIso = new Date().toISOString(); const today = nowIso.slice(0, 10);

const walk = (dir: string): string[] => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]) : [];
let waiting = 0;

for (const dir of ["projects", "updates", "posts"]) {
  for (const file of walk(path.join(CONTENT_DIR, dir))) {
    const isMd = file.endsWith(".md");
    const raw = fs.readFileSync(file, "utf8");
    const parsed = isMd ? matter(raw) : { data: JSON.parse(raw), content: "" };
    const d = parsed.data as Record<string, any>;
    if (d.status !== "proposed" || (only && !only.includes(d.id))) continue;
    waiting++;
    console.log(`${yes ? "publishing" : "waiting   "} ${d.id}  ${d.title}`);
    if (!yes) continue;
    d.status = "published";
    if (dir !== "projects") d.publishedAt = d.publishedAt ?? nowIso;
    if (dir === "projects") d.dates = { ...d.dates, reviewed: today };
    if (dir === "updates") d.provenance = { ...d.provenance, editedByOwner: true, reviewedAt: nowIso };
    fs.writeFileSync(file, isMd ? matter.stringify(parsed.content, d) : JSON.stringify(d, null, 2) + "\n");
  }
}
const nowFile = path.join(CONTENT_DIR, "now.json");
if (fs.existsSync(nowFile)) {
  const n = JSON.parse(fs.readFileSync(nowFile, "utf8"));
  if (n.status === "proposed" && (!only || only.includes("now"))) {
    waiting++; console.log(`${yes ? "publishing" : "waiting   "} now  Now page`);
    if (yes) { n.status = "published"; n.reviewedBy = "owner"; n.reviewedAt = today; fs.writeFileSync(nowFile, JSON.stringify(n, null, 2) + "\n"); }
  }
}
console.log(waiting === 0 ? "Nothing is waiting for approval." : yes ? `\nDone. Run npm run content:validate, then commit.` : `\n${waiting} item(s) waiting. Review them in the preview, then re-run with --yes.`);
