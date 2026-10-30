import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { personLd } from "../lib/jsonld";
import { loadProjects } from "../lib/content/load";
import { isShown } from "../lib/content/visibility";
import { services } from "../lib/services";
import { SITE_SKINS } from "../lib/skin";
import { site } from "../lib/site";
import { findSecrets, scan } from "../scripts/guard-secrets";
import { hashName, scanText } from "../scripts/guard-private-names";

const read = (f: string) => fs.readFileSync(f, "utf8");

// These tests exist to stop well-meaning but careless edits (by any agent or person) from quietly undoing
// decisions the owner made on purpose. If one fails, read AGENTS.md before changing the test.

test("positioning: the site presents an Experience Engineer, not a web developer or agency", () => {
  assert.match(site.title, /Experience Engineer/);
  assert.match(site.description, /Experience Engineer/);
  assert.equal(personLd().jobTitle, "Experience Engineer");
  const home = read("app/page.tsx");
  assert.match(home, /Experience Engineer/);
  const about = read("app/about/page.tsx");
  assert.match(about, /Experience Engineer/);
  // Public journal pages must not describe him with the framing he rejected.
  for (const f of ["app/page.tsx", "app/about/page.tsx", "app/services/page.tsx", "app/learn/page.tsx", "lib/site.ts", "lib/capabilities.ts", "components/Footer.tsx"]) {
    assert.doesNotMatch(read(f), /\b(web developer|freelancer|freelance|web agency|cheap labor|affordable websites)\b/i, `${f} uses rejected positioning`);
  }
});

test("pricing: no fixed prices anywhere in services, only custom quotes", () => {
  for (const s of services.filter((x) => x.kind === "software")) assert.doesNotMatch(s.price, /\$\s?\d/, `${s.slug} shows a fixed price`);
  assert.doesNotMatch(read("app/services/page.tsx"), /\$\s?\d/);
});

test("the portfolio structure the owner chose is intact", () => {
  const shown = loadProjects().filter(isShown);
  const feat = (slug: string) => shown.find((p) => p.slug === slug)?.tier;
  for (const slug of ["pipeline-crm", "thriftscout", "ultimate", "thornwild", "lineage", "mosslight", "lumen", "swirl-room", "reality-research"]) assert.equal(feat(slug), "featured", `${slug} must stay featured unless the owner says otherwise`);
  assert.ok(shown.length >= 28, "published projects went missing");
  for (const p of shown) assert.ok(["production", "beta", "prototype", "concept"].includes(p.maturity));
});

test("existing capabilities were not removed: studio, sync, learn, lab, skins, contact, demos check", () => {
  for (const f of ["app/studio/page.tsx", "lib/sync/import.ts", "app/learn/page.tsx", "app/lab/page.tsx", "app/api/contact/route.ts", "scripts/check-demos.ts", "components/HeroField.tsx", "lib/content/schemas.ts", "AGENTS.md", ".github/CODEOWNERS", ".github/pull_request_template.md"]) assert.ok(fs.existsSync(f), `${f} was removed`);
  assert.equal(SITE_SKINS.length, 7, "site styles were removed");
  assert.ok(fs.readdirSync("app/lab/[skin]").length > 0);
});

test("AGENTS.md carries the non-negotiable rules for AI agents", () => {
  const a = read("AGENTS.md");
  for (const phrase of ["Non-negotiables", "Never push to main", "owner-documented", "custom quote", "Experience Engineer", "npm run verify"]) assert.ok(a.includes(phrase), `AGENTS.md lost: ${phrase}`);
  assert.match(read("CLAUDE.md"), /@AGENTS\.md/);
});

test("no file in the repository root is a metrics ranking or an inventory of private work", () => {
  for (const f of fs.readdirSync(".")) assert.doesNotMatch(f, /ranking|inventory|private/i, `${f} must not be committed to a public repository`);
});

test("secret guard recognises credentials (fixtures are built at runtime so none sit in the repo)", () => {
  const fake = {
    github: "ghp_" + "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8",
    stripe: "sk_" + "live_" + "4eC39HqLyjWDarjtT1zdp7dc",
    resend: "re_" + "AbCdEfGhIjKlMnOpQrStUvWx",
    key: "-----BEGIN " + "PRIVATE KEY-----",
  };
  for (const [name, value] of Object.entries(fake)) assert.ok(findSecrets(`x = "${value}"`).length > 0, `${name} not detected`);
  assert.deepEqual(findSecrets("const url = 'https://mauricegarcia.com'; // nothing secret here"), []);
  const problems = scan([".env.local", ".env.example", "a.ts"], (f) => (f === "a.ts" ? "fine" : ""));
  assert.equal(problems.length, 1); assert.match(problems[0], /\.env\.local/);
});

test("private-name guard: matches hyphenated, embedded and path occurrences without storing names", () => {
  const salt = "t:"; const hashes = new Set([hashName(salt, "secret-client-app"), hashName(salt, "zorbtech")]);
  assert.equal(scanText("see github.com/me/secret-client-app for details", salt, hashes).length, 1);
  assert.equal(scanText("a secret-client-app-v2 branch", salt, hashes).length, 1, "longer names containing it");
  assert.equal(scanText("ZorbTech", salt, hashes).length, 1, "case-insensitive");
  assert.equal(scanText("an ordinary sentence about clients and apps", salt, hashes).length, 0);
  const cfg = JSON.parse(read("scripts/private-names.json"));
  assert.ok(cfg.hashes.length >= 40 && cfg.hashes.every((h: string) => /^[0-9a-f]{64}$/.test(h)));
  assert.ok(!/[a-z]{6,}-[a-z]{4,}/.test(JSON.stringify(cfg).replace(/[0-9a-f]{64}/g, "")), "the names file must hold hashes only");
});
