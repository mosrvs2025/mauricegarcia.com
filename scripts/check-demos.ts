import { createRequire } from "node:module";
import { loadProjects } from "../lib/content/load";
import { isShown } from "../lib/content/visibility";

/**
 * Verifies every public demo link on a shown project.
 *   npm run demos:check             HTTP only: each demo answers 2xx with an HTML body (fast, used weekly in CI)
 *   npm run demos:check -- --browser  also loads each in a real browser and fails on failed API calls or error text
 *                                      (needs `playwright`; this is what catches "the page loads but its data doesn't")
 * Exit code 1 if any demo is broken, so a scheduled run turns red.
 */
const useBrowser = process.argv.includes("--browser");
type Result = { slug: string; url: string; ok: boolean; problems: string[] };

async function http(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(25000), headers: { "User-Agent": "mauricegarcia-demo-check" } });
    const problems: string[] = [];
    if (!res.ok) problems.push(`HTTP ${res.status}`);
    const body = await res.text();
    if (body.trim().length < 200) problems.push("page body is nearly empty");
    return problems;
  } catch (e) { return [`unreachable: ${(e as Error).message.slice(0, 80)}`]; }
}

async function browser(urls: [string, string][]): Promise<Map<string, string[]> | null> {
  const out = new Map<string, string[]>();
  let pw: any;
  try { pw = createRequire(process.cwd() + "/")("playwright"); } catch { return null; }
  const b = await pw.chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const queue = [...urls];
  await Promise.all(Array.from({ length: 4 }).map(async () => {
    while (queue.length) {
      const [slug, url] = queue.shift()!;
      const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
      const problems: string[] = [];
      page.on("response", (r: any) => { if (r.status() >= 400 && !/favicon|\.map$|manifest|apple-touch/.test(r.url()) && new URL(r.url()).origin === new URL(url).origin) problems.push(`${r.status()} ${new URL(r.url()).pathname.slice(0, 40)}`); });
      try {
        await page.goto(url, { waitUntil: "load", timeout: 45000 }); await page.waitForTimeout(3500);
        const text: string = (await page.innerText("body").catch(() => "")).replace(/\s+/g, " ").slice(0, 600);
        if (/didn.t load|something went wrong|application error|failed to load/i.test(text)) problems.push("the page shows an error message");
      } catch (e) { problems.push(`browser could not load it: ${(e as Error).message.slice(0, 60)}`); }
      // A failing /api/ai without a key is expected for Lumen and is a fallback, not a broken demo.
      out.set(slug, problems.filter((p) => !(slug === "lumen" && /\/api\/ai/.test(p))));
      await page.close();
    }
  }));
  await b.close();
  return out;
}

async function main() {
  const targets = loadProjects().filter(isShown).filter((p) => p.links.demo).map((p) => [p.slug, p.links.demo!] as [string, string]);
  const results: Result[] = [];
  for (const [slug, url] of targets) { const problems = await http(url); results.push({ slug, url, ok: problems.length === 0, problems }); }
  let browserRan = false;
  if (useBrowser) {
    const extra = await browser(targets);
    if (!extra) { console.error("--browser needs the `playwright` package (npm i -D playwright). Not claiming a browser check that did not run."); process.exit(2); }
    browserRan = true;
    for (const r of results) { const p = extra.get(r.slug) ?? []; r.problems.push(...p); r.ok = r.problems.length === 0; }
  }
  for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.slug.padEnd(24)} ${r.ok ? r.url : r.problems.join("; ")}`);
  const bad = results.filter((r) => !r.ok);
  console.log(`\n${results.length - bad.length}/${results.length} demos working${browserRan ? " (browser-checked)" : " (HTTP only)"}.`);
  if (bad.length) { console.error(`Broken: ${bad.map((b) => b.slug).join(", ")}. Remove links.demo (and say why in stateNote) until fixed; beta also requires a working demo.`); process.exit(1); }
}
main();
