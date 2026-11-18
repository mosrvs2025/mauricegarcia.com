/*
 * Regenerates docs/screenshots/*.webp for the README from a running site.
 *
 *   npm run build && npm start                      # in one terminal (http://localhost:3000)
 *   BASE_URL=http://localhost:3000 node scripts/capture-screenshots.cjs
 *
 * Needs Playwright with Chromium and Python's Pillow (for the PNG to WebP step); neither is a project dependency.
 * The intro frames freeze the page's animation clock at fixed times so they come out identical every run.
 */
const { chromium } = require("playwright");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.join(__dirname, "..", "docs", "screenshots");
const RAW = fs.mkdtempSync(path.join(os.tmpdir(), "mg-shots-"));
const SKINS = ["open-case", "rogue-instrument", "unauthorized-manual", "workshop", "paper", "terminal", "pop", "glass", "swiss", "arcade"];

async function context(browser, { skin, w = 1440, h = 900, skipIntro = true, ...rest } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...rest });
  await ctx.addInitScript(([s, skip]) => {
    try { if (s) localStorage.setItem("mg-skin", s); if (skip) sessionStorage.setItem("mg-intro-seen", "1"); } catch { /* storage blocked */ }
  }, [skin || "", skipIntro]);
  return ctx;
}
const shot = (page, name) => page.screenshot({ path: path.join(RAW, `${name}.png`) });

(async () => {
  const browser = await chromium.launch();

  // The intro: freeze every animation at a chosen time (ms) so the frame is exact.
  let ctx = await context(browser, { skipIntro: false });
  let page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "commit" });
  await page.waitForSelector("html.mg-intro-on #mg-intro .b1", { state: "attached" });
  for (const [name, t] of [["intro-1-black-hole", 900], ["intro-2-swallow", 1600], ["intro-3-wordmark", 2250], ["intro-4-curtains", 2950]]) {
    await page.evaluate((ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; }), t);
    await page.waitForTimeout(150);
    await shot(page, name);
  }
  await ctx.close();

  // Hero, home spotlight, projects, a project page (intro skipped).
  ctx = await context(browser); page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
  await shot(page, "hero");
  const spot = page.locator("section.us");
  if (await spot.count()) { await spot.scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, -90)); await page.waitForTimeout(700); await shot(page, "home-ultimate"); }
  await page.goto(`${BASE}/projects`, { waitUntil: "networkidle" });
  await page.locator(".j-bento").scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, -110)); await page.waitForTimeout(700);
  await shot(page, "projects");
  await page.goto(`${BASE}/projects/ultimate`, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  await shot(page, "project-ultimate");
  await ctx.close();

  // Skins and mobile.
  for (const skin of SKINS) {
    ctx = await context(browser, { skin }); page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
    await shot(page, `skin-${skin}`); await ctx.close();
  }
  ctx = await context(browser, { w: 390, h: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" }); await page.waitForTimeout(1000);
  await shot(page, "mobile-hero"); await ctx.close();
  await browser.close();

  fs.mkdirSync(OUT, { recursive: true });
  execFileSync("python3", ["-I", "-c", `
import glob, os, sys
from PIL import Image
for f in sorted(glob.glob(os.path.join(sys.argv[1], "*.png"))):
    Image.open(f).convert("RGB").save(os.path.join(sys.argv[2], os.path.basename(f)[:-4] + ".webp"), "WEBP", quality=82, method=6)
`, RAW, OUT], { stdio: "inherit" });
  fs.rmSync(RAW, { recursive: true, force: true });
  console.log(`Wrote ${fs.readdirSync(OUT).length} screenshots to ${path.relative(process.cwd(), OUT)}`);
})();
