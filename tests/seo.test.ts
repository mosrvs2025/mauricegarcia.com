import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { aboutPageLd, personLd, projectLd, websiteLd } from "../lib/jsonld";
import { bio, llmsFullTxt, llmsTxt } from "../lib/llms";
import { loadProjects } from "../lib/content/load";
import { isShown } from "../lib/content/visibility";
import { AI_CRAWLERS } from "../lib/seo";
import { abs, site } from "../lib/site";

const read = (f: string) => fs.readFileSync(f, "utf8");
const APEX = /https?:\/\/mauricegarcia\.com/;

test("canonical host: www is the single site URL and the apex never appears in generated output", () => {
  assert.equal(site.url, "https://www.mauricegarcia.com");
  assert.equal(abs("/about"), "https://www.mauricegarcia.com/about");
  const out = JSON.stringify([robots(), sitemap(), personLd(), websiteLd(), aboutPageLd()]) + llmsTxt() + llmsFullTxt();
  assert.doesNotMatch(out, APEX);
  for (const p of loadProjects().filter(isShown)) assert.doesNotMatch(JSON.stringify(projectLd(p)), APEX);
  // A stale environment variable must not move the canonical host.
  assert.doesNotMatch(read("lib/site.ts"), /url:\s*process\.env/);
});

test("no source file hardcodes the apex as a site URL (www is canonical)", () => {
  for (const f of ["lib/contact-emails.ts", "lib/site.ts", "lib/jsonld.ts", "lib/llms.ts", "app/layout.tsx", "app/robots.ts", "app/sitemap.ts"]) assert.doesNotMatch(read(f), APEX, f);
});

test("robots.txt: existing disallows kept, every AI crawler explicitly allowed, sitemap on www", () => {
  const r = robots();
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
  const star = rules.find((x) => x.userAgent === "*");
  assert.deepEqual(star?.disallow, ["/studio", "/api/"]);
  assert.equal(star?.allow, "/");
  for (const bot of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot", "Bingbot"]) {
    assert.ok(AI_CRAWLERS.includes(bot as never), `${bot} missing from the crawler list`);
    const rule = rules.find((x) => x.userAgent === bot);
    assert.ok(rule, `${bot} has no rule`);
    assert.equal(rule.allow, "/");
    assert.deepEqual(rule.disallow, ["/studio", "/api/"], `${bot} must keep the studio and API disallows`);
  }
  assert.equal(r.sitemap, "https://www.mauricegarcia.com/sitemap.xml");
});

test("sitemap lists only www URLs, includes the REALMBREAK project page, and never another host", () => {
  const urls = sitemap().map((e) => e.url);
  assert.ok(urls.every((u) => u.startsWith("https://www.mauricegarcia.com/")));
  assert.ok(urls.includes("https://www.mauricegarcia.com/projects/realmbreak"));
  assert.ok(!urls.some((u) => u.includes("mr.mauricegarcia.com")));
});

test("llms.txt follows llmstxt.org and links the required places", () => {
  const t = llmsTxt();
  const lines = t.split("\n");
  assert.equal(lines[0], "# Maurice Garcia");
  assert.match(lines[2], /^> /);
  assert.equal(lines.filter((l) => l.startsWith("# ")).length, 1, "exactly one H1");
  for (const url of ["https://github.com/mosrvs2025", "https://mr.mauricegarcia.com", "https://www.mauricegarcia.com/about", "https://www.mauricegarcia.com/projects", "https://www.mauricegarcia.com/projects/realmbreak", "https://www.mauricegarcia.com/llms-full.txt"]) assert.ok(t.includes(url), `llms.txt lacks ${url}`);
  assert.match(t, /^## Key projects$/m);
  assert.doesNotMatch(t + llmsFullTxt(), /\$\s?\d/, "no prices");
  assert.match(t, /custom quote only/i);
});

test("llms-full.txt carries every listed project with its maturity and limitations", () => {
  const t = llmsFullTxt();
  for (const p of loadProjects().filter((x) => isShown(x) && x.visibility === "public")) {
    assert.ok(t.includes(`### ${p.title}`), `${p.slug} missing`);
    assert.ok(t.includes(abs(`/projects/${p.slug}`)));
  }
  assert.match(t, /Maturity: Prototype/);
});

test("the llms bio only repeats claims that are on the site already", () => {
  const about = read("app/about/page.tsx").replace(/&apos;/g, "'") + read("lib/profile.ts");
  for (const claim of ["turning ambitious ideas into things that actually run", "not selling hours", "for more than ten years", "licensing, partnerships and backing", "AI coding assistants", "slow, manual, error-prone work"]) {
    assert.ok(about.toLowerCase().includes(claim.toLowerCase()), `site content no longer says: ${claim}`);
  }
  assert.match(bio.join(" "), /Experience Engineer, creative technologist and independent builder/);
  assert.doesNotMatch(bio.join(" "), /\b(web developer|freelancer|freelance|agency)\b/i);
});

test("JSON-LD: one Person with sameAs, one WebSite, a ProfilePage that points at the Person", () => {
  const person = personLd(); const web = websiteLd(); const profile = aboutPageLd();
  assert.equal(person["@type"], "Person");
  assert.equal(person["@id"], "https://www.mauricegarcia.com/#person");
  assert.equal(person.url, "https://www.mauricegarcia.com");
  assert.ok(person.image.startsWith("https://www.mauricegarcia.com/"));
  assert.ok(person.sameAs.includes("https://github.com/mosrvs2025") && person.sameAs.includes("https://instagram.com/itstherealmoe"));
  assert.equal(web["@type"], "WebSite");
  assert.deepEqual(web.author, { "@id": person["@id"] });
  assert.equal(profile["@type"], "ProfilePage");
  assert.deepEqual(profile.mainEntity, { "@id": person["@id"] });
  const layout = read("app/layout.tsx"), about = read("app/about/page.tsx");
  assert.equal((layout.match(/personLd\(\)/g) ?? []).length, 1);
  assert.ok(!about.includes("personLd"), "the About page must reference the Person, not repeat it");
});

test("project JSON-LD: types follow the project file, maturity passes through, demos read as software", () => {
  const all = loadProjects().filter(isShown);
  const rb = projectLd(all.find((p) => p.slug === "realmbreak")!) as Record<string, unknown>;
  assert.deepEqual(rb["@type"], ["SoftwareSourceCode", "VideoGame"]);
  assert.equal(rb.creativeWorkStatus, "Prototype");
  assert.equal(rb.url, "https://www.mauricegarcia.com/projects/realmbreak");
  const noDemo = projectLd(all.find((p) => !p.links.demo && p.links.repo)!) as Record<string, unknown>;
  assert.equal(noDemo["@type"], "SoftwareSourceCode");
  assert.equal(noDemo.operatingSystem, undefined);
});

test("REALMBREAK: project page, public-repo source entry and the short link all exist", () => {
  const sources = JSON.parse(read("content/sources.json")).sources as { repo: string; projectId: string; branch: string }[];
  assert.ok(sources.some((s) => s.repo === "mosrvs2025/realmbreak" && s.projectId === "prj-realmbreak" && s.branch === "main"));
  assert.match(read("next.config.ts"), /source: "\/realmbreak", destination: "\/projects\/realmbreak"/);
});

test("analytics are untouched: Google Analytics keeps its measurement id (Vercel Analytics is enabled on the platform, not in code)", () => {
  assert.match(read("components/Analytics.tsx"), /G-J4KMZHQTSP/);
});
