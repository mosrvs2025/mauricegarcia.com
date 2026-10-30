import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

/**
 * Fails if the name of a PRIVATE repository or client project appears in any tracked file.
 * The names are stored only as salted SHA-256 hashes (scripts/private-names.json), so this file can
 * live in a public repository without listing what it protects. Names that are intentionally public
 * (shown projects) were left out when the list was created, so they never trigger it.
 *
 *   npm run guard:names                         check
 *   npm run guard:names -- --add some-repo      protect another name (appends its hash)
 */
const FILE = "scripts/private-names.json";
export const hashName = (salt: string, name: string) => crypto.createHash("sha256").update(salt + name.toLowerCase()).digest("hex");

/** Every run of 1..6 hyphen/underscore/dot separated words in the text, lowercased, so "a-b-c" is also checked as "a-b", "b-c", "a", "b", "c". */
export function* candidates(text: string): Generator<string> {
  for (const m of text.toLowerCase().matchAll(/[a-z0-9][a-z0-9._-]*[a-z0-9]|[a-z0-9]/g)) {
    const parts = m[0].split(/[._-]+/).filter(Boolean);
    if (parts.length === 1) { if (parts[0].length >= 4) yield parts[0]; continue; }
    for (let i = 0; i < parts.length; i++) {
      let joined = "";
      for (let j = i; j < Math.min(parts.length, i + 6); j++) { joined = j === i ? parts[i] : `${joined}-${parts[j]}`; if (joined.length >= 4) yield joined; }
    }
  }
}

export function scanText(text: string, salt: string, hashes: Set<string>): string[] {
  const hit = new Set<string>();
  for (const c of candidates(text)) if (hashes.has(hashName(salt, c))) hit.add(hashName(salt, c).slice(0, 8));
  return [...hit];
}

if (process.argv[1]?.endsWith("guard-private-names.ts")) {
  const cfg = JSON.parse(fs.readFileSync(FILE, "utf8")) as { salt: string; hashes: string[] };
  const addAt = process.argv.indexOf("--add");
  if (addAt > -1) {
    const name = process.argv[addAt + 1];
    if (!name || name.length < 4) { console.error("Give a name of at least 4 characters."); process.exit(1); }
    const h = hashName(cfg.salt, name);
    if (!cfg.hashes.includes(h)) cfg.hashes.push(h);
    fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2) + "\n");
    console.log(`Added a hash for one name (${cfg.hashes.length} protected). Run the check to see if it already appears anywhere.`);
    process.exit(0);
  }
  const hashes = new Set(cfg.hashes);
  const files = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
  const problems: string[] = [];
  for (const f of files) {
    if (f === FILE || /\.(png|jpe?g|webp|gif|ico|mp4|webm|pdf|woff2?|ttf)$/i.test(f) || f.endsWith("package-lock.json")) continue;
    let text: string; try { text = fs.readFileSync(f, "utf8"); } catch { continue; }
    if (text.length > 1_500_000) continue;
    const hits = scanText(f + "\n" + text, cfg.salt, hashes); // the path counts too: a file named for a private repo is a leak
    for (const h of hits) problems.push(`${f}: contains a protected private name (hash ${h}…)`);
  }
  if (problems.length) {
    console.error("Private-name guard FAILED:\n" + problems.map((p) => "  - " + p).join("\n"));
    console.error("\nPrivate repositories and clients must not be named in this public repository without documented permission (see AGENTS.md).\nIf the name is now intentionally public, remove its hash from scripts/private-names.json.");
    process.exit(1);
  }
  console.log(`Private-name guard passed: ${files.length} tracked files, ${hashes.size} protected names.`);
}
