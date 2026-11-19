/*
 * After screenshots for the three-identity redesign (docs/redesign/spec.md), named like docs/redesign/before/ so the two
 * sets compare one to one. Reduced motion, ?intro=0, the Playground minimised, lazy images loaded before full-page shots.
 * Also writes grayscale side-by-sides of the three identities (the spec asks that they differ with colour removed).
 *
 *   BASE_URL=http://localhost:3000 node scripts/capture-redesign.cjs      (OUT defaults to docs/redesign/after)
 *
 * Needs Playwright with Chromium and Python's Pillow; neither is a project dependency. Writes WebP to keep the repo small.
 * The removed contact pieces (Five ways grid, contact band, floating pill) are replaced in this set by the navigation's
 * contact control, the phone contact rail and /connect.
 */
const { chromium } = require("playwright");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve(process.env.OUT || "docs/redesign/after");
const RAW = fs.mkdtempSync(path.join(os.tmpdir(), "mg-redesign-"));
const IDS = ["open-case", "rogue-instrument", "unauthorized-manual"];
const SIZES = [["desktop-1440", 1440, 900, 1, false], ["mobile-390", 390, 844, 2, true]];

async function shoot(browser, { skin, url, size, name, full, clip }) {
  const [, w, h, dpr, mobile] = size;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
  await ctx.addInitScript(([s]) => { try { localStorage.setItem("mg-skin", s); localStorage.setItem("mg-play-min", "1"); sessionStorage.setItem("mg-intro-seen", "1"); } catch { /* blocked */ } }, [skin]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}${url}${url.includes("?") ? "&" : "?"}intro=0`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (full || clip) await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); } scrollTo(0, 0); });
  await page.waitForTimeout(900);
  if (clip) { await page.locator(clip).first().scrollIntoViewIfNeeded(); await page.waitForTimeout(400); }
  await page.screenshot({ path: path.join(RAW, `${name}.png`), fullPage: !!full });
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  for (const size of SIZES) {
    for (const skin of IDS) {
      await shoot(browser, { skin, url: "/", size, name: `home-${skin}-${size[0]}` });
      await shoot(browser, { skin, url: "/", size, name: `home-${skin}-${size[0]}-full`, full: true });
      await shoot(browser, { skin, url: "/connect", size, name: `connect-${skin}-${size[0]}` });
      await shoot(browser, { skin, url: "/projects", size, name: `projects-${skin}-${size[0]}` });
      await shoot(browser, { skin, url: "/", size, name: `home-work-${skin}-${size[0]}`, clip: "#worlds-h" });
    }
    await shoot(browser, { skin: "workshop", url: "/", size, name: `home-workshop-${size[0]}` });
    await shoot(browser, { skin: "workshop", url: "/", size, name: `home-workshop-${size[0]}-full`, full: true });
  }
  await browser.close();
  fs.mkdirSync(OUT, { recursive: true });
  execFileSync("python3", ["-I", "-c", `
import glob, os, sys
from PIL import Image, ImageOps
raw, out = sys.argv[1], sys.argv[2]
for f in sorted(glob.glob(os.path.join(raw, "*.png"))):
    im = Image.open(f).convert("RGB")
    if im.height > 12000: im = im.crop((0, 0, im.width, 12000))
    im.save(os.path.join(out, os.path.basename(f)[:-4] + ".webp"), "WEBP", quality=78, method=6)
for size in ["desktop-1440", "mobile-390"]:
    ims = [ImageOps.grayscale(Image.open(os.path.join(raw, f"home-{s}-{size}.png"))) for s in ["open-case", "rogue-instrument", "unauthorized-manual"]]
    gap = 24; w = sum(i.width for i in ims) + gap * 2; h = max(i.height for i in ims)
    sheet = Image.new("L", (w, h), 255); x = 0
    for i in ims: sheet.paste(i, (x, 0)); x += i.width + gap
    if sheet.width > 3000: sheet = sheet.resize((sheet.width // 2, sheet.height // 2))
    sheet.save(os.path.join(out, f"grayscale-identities-{size}.webp"), "WEBP", quality=78, method=6)
`, RAW, OUT], { stdio: "inherit" });
  fs.rmSync(RAW, { recursive: true, force: true });
  console.log(`Wrote ${fs.readdirSync(OUT).length} files to ${path.relative(process.cwd(), OUT)}`);
})();
