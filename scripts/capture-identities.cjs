/*
 * Before/after screenshots for the identity switcher: the homepage, a project page and a writing page, at desktop
 * (1440x900) and mobile (390x844), once per identity. Deterministic: ?intro=0, intro flag set, animations settled.
 *
 *   BASE_URL=http://localhost:3000 OUT=docs/screenshots/identity/open-case SKIN=open-case node scripts/capture-identities.cjs
 *   (no SKIN = whatever the site's default is, used for the "before" capture)
 *
 * Needs Playwright with Chromium and Python's Pillow for the PNG to WebP step; neither is a project dependency.
 */
const { chromium } = require("playwright");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve(process.env.OUT || "docs/screenshots/identity/current");
const SKIN = process.env.SKIN || "";
const PAGES = (process.env.PAGES || "home:/,project:/projects/ultimate,writing:/writing/how-this-site-stays-current").split(",").map((s) => s.split(":"));
const SIZES = [["desktop", 1440, 900, 1, false], ["mobile", 390, 844, 2, true]];
const RAW = fs.mkdtempSync(path.join(os.tmpdir(), "mg-identity-"));

(async () => {
  const browser = await chromium.launch();
  for (const [label, w, h, dpr, mobile] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
    await ctx.addInitScript(([s]) => { try { if (s) localStorage.setItem("mg-skin", s); sessionStorage.setItem("mg-intro-seen", "1"); } catch { /* storage blocked */ } }, [SKIN]);
    for (const [name, url] of PAGES) {
      const page = await ctx.newPage();
      await page.goto(`${BASE}${url}${url.includes("?") ? "&" : "?"}intro=0`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(RAW, `${name}-${label}.png`) });
      if (name === "home") await page.screenshot({ path: path.join(RAW, `${name}-${label}-full.png`), fullPage: true });
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  fs.mkdirSync(OUT, { recursive: true });
  execFileSync("python3", ["-I", "-c", `
import glob, os, sys
from PIL import Image
for f in sorted(glob.glob(os.path.join(sys.argv[1], "*.png"))):
    im = Image.open(f).convert("RGB")
    if im.height > 8000: im = im.crop((0, 0, im.width, 8000))
    im.save(os.path.join(sys.argv[2], os.path.basename(f)[:-4] + ".webp"), "WEBP", quality=80, method=6)
`, RAW, OUT], { stdio: "inherit" });
  fs.rmSync(RAW, { recursive: true, force: true });
  console.log(`Wrote ${fs.readdirSync(OUT).length} screenshots to ${path.relative(process.cwd(), OUT)}`);
})();
