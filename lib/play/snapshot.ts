/**
 * A one-off, approximate picture of part of the visible page, painted straight to a canvas. No dependencies.
 *
 * It reads layout and computed styles only and never writes to the DOM, so the real page can never be broken by
 * it. Only the part of the requested area that is inside the viewport is captured. It paints, in DOM order and
 * with fixed/sticky layers last: background colours with all four corner radii, background images (size and
 * position), borders, `<img>`/video/canvas with object-fit and object-position crops, inline SVG, ancestor
 * overflow clips, and text word by word at the browser's own word positions with the page's fonts. Images the
 * browser has not decoded yet get a muted placeholder, and CSS images are cached for the next blast.
 *
 * Not painted: gradients, shadows, filters, blend modes, pseudo-elements. Nothing is read back from the canvas, so
 * cross-origin images simply draw (or are skipped if refused) and can never taint anything that matters.
 * The caller falls back to procedural debris when this returns null or throws.
 */
export type Capture = { canvas: HTMLCanvasElement; left: number; top: number; width: number; height: number; scale: number; ms: number };

const MAX_ELEMENTS = 1800;
const MAX_WORDS = 600;
const CACHE_MAX = 80;

// ---- image cache (CSS backgrounds and inline SVG load asynchronously, so the first blast may miss them) --------------
const images = new Map<string, HTMLImageElement | "pending" | "failed">();
function cached(url: string): HTMLImageElement | null {
  const v = images.get(url);
  if (v instanceof HTMLImageElement) return v;
  if (v !== undefined) return null;
  if (images.size >= CACHE_MAX) { const first = images.keys().next().value; if (first !== undefined) images.delete(first); }
  images.set(url, "pending");
  const im = new Image();
  im.decoding = "async";
  im.onload = () => images.set(url, im);
  im.onerror = () => images.set(url, "failed");
  im.src = url;
  return null;
}

const urlOf = (bg: string) => { const m = /url\((?:"([^"]+)"|'([^']+)'|([^)]+))\)/.exec(bg); return m ? (m[1] || m[2] || m[3]) : null; };

/** Start loading the CSS background images near the viewport, so the first blast already has them. Call when idle. */
export function warmBackgrounds() {
  const vh = window.innerHeight; let n = 0;
  for (const el of Array.from(document.body.querySelectorAll("*"))) {
    if (n++ > 1500) break;
    if (el.closest("[data-play]")) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2 || r.width === 0) continue;
    const url = urlOf(getComputedStyle(el).backgroundImage);
    if (url) cached(url);
  }
}

// ---- helpers ------------------------------------------------------------------------------------------------------
const transparent = (c: string) => !c || c === "transparent" || /^rgba?\([^)]*[, /]\s*0(\.0+)?\s*\)$/.test(c) || /\/\s*0(\.0+)?\s*\)$/.test(c);

function pageBackground(): string {
  for (const el of [document.body, document.documentElement]) { const c = getComputedStyle(el).backgroundColor; if (!transparent(c)) return c; }
  return "#12100d";
}

/** Colours for procedural debris (background, surface, accent, text), taken from the page's own theme so fallback chips still look like this page. */
export function pagePalette(): string[] {
  const root = getComputedStyle(document.documentElement);
  const v = (n: string, d: string) => root.getPropertyValue(n).trim() || d;
  return [pageBackground(), v("--j-surface", "#1a1713"), v("--j-accent", "#ff7a4d"), v("--j-text", "#f3ede3")];
}

type Clip = { l: number; t: number; w: number; h: number; r: number[] };
type Info = { opacity: number; visible: boolean; late: boolean; clips: Clip[]; childClips: Clip[] };

function radii(cs: CSSStyleDeclaration, w: number, h: number): number[] {
  const one = (v: string) => { const f = (v || "0").split(" ")[0]; const n = parseFloat(f) || 0; return Math.max(0, Math.min(f.endsWith("%") ? (n / 100) * Math.min(w, h) : n, Math.min(w, h) / 2)); };
  return [one(cs.borderTopLeftRadius), one(cs.borderTopRightRadius), one(cs.borderBottomRightRadius), one(cs.borderBottomLeftRadius)];
}

function path(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number[]) {
  ctx.beginPath();
  if (r.some((n) => n > 0) && typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

/** A CSS position value on one axis: percentages place the object in the free space, lengths are offsets. */
const axis = (v: string | undefined, free: number) => (!v ? free / 2 : v.endsWith("%") ? (free * parseFloat(v)) / 100 : parseFloat(v) || 0);

function drawFitted(ctx: CanvasRenderingContext2D, src: CanvasImageSource, iw: number, ih: number, r: DOMRect, cs: CSSStyleDeclaration) {
  const fit = cs.objectFit;
  let w = r.width, h = r.height;
  if (fit === "cover" || fit === "contain" || fit === "scale-down" || fit === "none") {
    const k = fit === "cover" ? Math.max(r.width / iw, r.height / ih) : fit === "none" ? 1 : fit === "scale-down" ? Math.min(1, r.width / iw, r.height / ih) : Math.min(r.width / iw, r.height / ih);
    w = iw * k; h = ih * k;
  }
  const [px, py] = (cs.objectPosition || "50% 50%").split(" ");
  ctx.drawImage(src, r.left + axis(px, r.width - w), r.top + axis(py, r.height - h), w, h);
}

/** background-image with background-size and background-position (first layer, no repeat). */
function drawBackground(ctx: CanvasRenderingContext2D, im: HTMLImageElement, r: DOMRect, cs: CSSStyleDeclaration) {
  const iw = im.naturalWidth || r.width, ih = im.naturalHeight || r.height;
  const size = (cs.backgroundSize || "auto").split(",")[0].trim();
  let w = iw, h = ih;
  if (size === "cover") { const k = Math.max(r.width / iw, r.height / ih); w = iw * k; h = ih * k; }
  else if (size === "contain") { const k = Math.min(r.width / iw, r.height / ih); w = iw * k; h = ih * k; }
  else if (size !== "auto") {
    const [sw, sh] = size.split(" ");
    const len = (v: string, whole: number) => (v.endsWith("%") ? (whole * parseFloat(v)) / 100 : parseFloat(v));
    w = len(sw, r.width); h = sh && sh !== "auto" ? len(sh, r.height) : (w * ih) / iw;
    if (!Number.isFinite(w) || !Number.isFinite(h)) { w = iw; h = ih; }
  }
  const [px, py] = ((cs.backgroundPosition || "0% 0%").split(",")[0].trim()).split(" ");
  ctx.drawImage(im, r.left + axis(px, r.width - w), r.top + axis(py, r.height - h), w, h);
}

function svgUrl(svg: SVGElement, w: number, h: number, color: string): string | null {
  const html = svg.outerHTML;
  if (!html || html.length > 14000) return null;
  const end = html.indexOf(">");
  const head = html.slice(0, end).replace(/\s(?:width|height|style|xmlns)="[^"]*"/g, "");
  const xml = `${head} xmlns="http://www.w3.org/2000/svg" width="${Math.round(w)}" height="${Math.round(h)}" style="color:${color}"${html.slice(end)}`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
}

function paintElement(ctx: CanvasRenderingContext2D, el: Element, r: DOMRect, cs: CSSStyleDeclaration) {
  const rad = radii(cs, r.width, r.height);
  if (!transparent(cs.backgroundColor)) { ctx.fillStyle = cs.backgroundColor; path(ctx, r.left, r.top, r.width, r.height, rad); ctx.fill(); }
  const bgUrl = cs.backgroundImage !== "none" ? urlOf(cs.backgroundImage) : null;
  if (bgUrl) {
    const im = cached(bgUrl);
    if (im) { ctx.save(); path(ctx, r.left, r.top, r.width, r.height, rad); ctx.clip(); drawBackground(ctx, im, r, cs); ctx.restore(); }
  }
  // borders: one rounded stroke when all four sides match, otherwise straight edges
  const bw = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map((v) => parseFloat(v) || 0);
  const bc = [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor];
  const bs = [cs.borderTopStyle, cs.borderRightStyle, cs.borderBottomStyle, cs.borderLeftStyle];
  const shows = bw.map((w, i) => w > 0 && bs[i] !== "none" && bs[i] !== "hidden" && !transparent(bc[i]));
  if (shows.every(Boolean) && bw.every((w) => w === bw[0]) && bc.every((c) => c === bc[0])) {
    ctx.strokeStyle = bc[0]; ctx.lineWidth = bw[0]; path(ctx, r.left + bw[0] / 2, r.top + bw[0] / 2, r.width - bw[0], r.height - bw[0], rad.map((n) => Math.max(0, n - bw[0] / 2))); ctx.stroke();
  } else {
    if (shows[0]) { ctx.fillStyle = bc[0]; ctx.fillRect(r.left, r.top, r.width, bw[0]); }
    if (shows[1]) { ctx.fillStyle = bc[1]; ctx.fillRect(r.right - bw[1], r.top, bw[1], r.height); }
    if (shows[2]) { ctx.fillStyle = bc[2]; ctx.fillRect(r.left, r.bottom - bw[2], r.width, bw[2]); }
    if (shows[3]) { ctx.fillStyle = bc[3]; ctx.fillRect(r.left, r.top, bw[3], r.height); }
  }
  // replaced content
  const placeholder = () => { ctx.fillStyle = "rgba(128,128,128,.22)"; path(ctx, r.left, r.top, r.width, r.height, rad); ctx.fill(); };
  if (el instanceof HTMLImageElement) {
    if (el.complete && el.naturalWidth) { ctx.save(); path(ctx, r.left, r.top, r.width, r.height, rad); ctx.clip(); drawFitted(ctx, el, el.naturalWidth, el.naturalHeight, r, cs); ctx.restore(); } else placeholder();
  } else if (el instanceof HTMLVideoElement) {
    if (el.readyState >= 2 && el.videoWidth) { ctx.save(); path(ctx, r.left, r.top, r.width, r.height, rad); ctx.clip(); drawFitted(ctx, el, el.videoWidth, el.videoHeight, r, cs); ctx.restore(); } else placeholder();
  } else if (el instanceof HTMLCanvasElement) {
    if (el.width && el.height) { ctx.save(); path(ctx, r.left, r.top, r.width, r.height, rad); ctx.clip(); drawFitted(ctx, el, el.width, el.height, r, cs); ctx.restore(); }
  } else if (el instanceof SVGSVGElement) {
    const url = svgUrl(el, r.width, r.height, cs.color);
    const im = url ? cached(url) : null;
    if (im) ctx.drawImage(im, r.left, r.top, r.width, r.height);
  }
}

// ---- capture ------------------------------------------------------------------------------------------------------
/** Capture the part of a document-space rectangle that is currently inside the viewport. null: nothing to capture. */
export function captureRegion(docLeft: number, docTop: number, width: number, height: number, scale: number): Capture | null {
  const t0 = performance.now();
  const vw = document.documentElement.clientWidth || window.innerWidth, vh = window.innerHeight;
  const left = Math.floor(Math.max(docLeft, window.scrollX)), top = Math.floor(Math.max(docTop, window.scrollY));
  const right = Math.ceil(Math.min(docLeft + width, window.scrollX + vw)), bottom = Math.ceil(Math.min(docTop + height, window.scrollY + vh));
  const w = right - left, h = bottom - top;
  if (w < 8 || h < 8) return null;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w * scale)); canvas.height = Math.max(1, Math.ceil(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const vl = left - window.scrollX, vt = top - window.scrollY, vr = vl + w, vb = vt + h; // region in viewport coordinates
  ctx.scale(scale, scale);
  ctx.fillStyle = pageBackground(); ctx.fillRect(0, 0, w, h);
  ctx.translate(-vl, -vt);

  const accent = getComputedStyle(document.documentElement).getPropertyValue("--j-accent").trim() || "#ff7a4d";
  const info = new Map<Element, Info>();
  const infoFor = (el: Element): Info => {
    let i = info.get(el);
    if (i) return i;
    const cs = getComputedStyle(el);
    const parent = el.parentElement && el.parentElement !== document.documentElement ? infoFor(el.parentElement) : { opacity: 1, visible: true, late: false, clips: [], childClips: [] as Clip[] };
    let own: Clip | null = null;
    if (el !== document.body && (cs.overflowX !== "visible" || cs.overflowY !== "visible")) { const r = el.getBoundingClientRect(); own = { l: r.left, t: r.top, w: r.width, h: r.height, r: radii(cs, r.width, r.height) }; }
    i = {
      opacity: parent.opacity * (parseFloat(cs.opacity) || 0),
      visible: cs.display !== "none" && cs.visibility === "visible" && parent.visible,
      late: parent.late || cs.position === "fixed" || cs.position === "sticky",
      clips: parent.childClips,
      childClips: own ? [...parent.childClips, own] : parent.childClips,
    };
    info.set(el, i);
    return i;
  };

  const draws: { late: boolean; run: () => void }[] = [];
  const wrap = (inf: Info, fn: () => void) => () => {
    ctx.save(); ctx.globalAlpha = inf.opacity;
    for (const c of inf.clips) { path(ctx, c.l, c.t, c.w, c.h, c.r); ctx.clip(); }
    try { fn(); } catch { /* one odd element never stops a blast */ }
    ctx.restore();
  };
  let words = 0;
  const range = document.createRange();
  const els = document.body.querySelectorAll("*");
  let seen = 0;
  for (let n = 0; n < els.length && seen < MAX_ELEMENTS; n++) {
    const el = els[n];
    if (el.closest("[data-play]") || el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right < vl || r.left > vr || r.bottom < vt || r.top > vb) continue;
    seen++;
    const inf = infoFor(el);
    if (!inf.visible || inf.opacity < 0.02) continue;
    const cs = getComputedStyle(el);
    draws.push({ late: inf.late, run: wrap(inf, () => paintElement(ctx, el, r, cs)) });
    if (el instanceof SVGElement && !(el instanceof SVGSVGElement)) continue;
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType !== 3 || !node.nodeValue || !node.nodeValue.trim() || words >= MAX_WORDS) continue;
      range.selectNodeContents(node);
      const nb = range.getBoundingClientRect();
      if (nb.right < vl || nb.left > vr || nb.bottom < vt || nb.top > vb) continue;
      const text = node.nodeValue; const pieces: { w: string; x: number; y: number; wd: number; h: number }[] = [];
      const re = /\S+/g; let m: RegExpExecArray | null;
      while ((m = re.exec(text)) && words < MAX_WORDS) {
        range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length);
        const wr = range.getBoundingClientRect();
        if (wr.width === 0 || wr.right < vl || wr.left > vr || wr.bottom < vt || wr.top > vb) continue;
        pieces.push({ w: m[0], x: wr.left, y: wr.top, wd: wr.width, h: wr.height }); words++;
      }
      if (!pieces.length) continue;
      let color = cs.color;
      if (transparent(color)) color = !transparent(cs.webkitTextFillColor) ? cs.webkitTextFillColor : accent; // gradient/clipped text
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const size = parseFloat(cs.fontSize) || 16;
      const tt = cs.textTransform, ls = cs.letterSpacing, deco = cs.textDecorationLine;
      draws.push({ late: inf.late, run: wrap(inf, () => {
        ctx.fillStyle = color; ctx.font = font; ctx.textBaseline = "alphabetic";
        if ("letterSpacing" in ctx && ls !== "normal") (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = ls;
        const fm = ctx.measureText("Hg");
        const asc = fm.fontBoundingBoxAscent, desc = fm.fontBoundingBoxDescent;
        const lines: { x1: number; x2: number; y: number }[] = [];
        for (const p of pieces) {
          const t = tt === "uppercase" ? p.w.toUpperCase() : tt === "lowercase" ? p.w.toLowerCase() : tt === "capitalize" ? p.w.charAt(0).toUpperCase() + p.w.slice(1) : p.w;
          const base = Number.isFinite(asc) && Number.isFinite(desc) ? p.y + (p.h - (asc + desc)) / 2 + asc : p.y + p.h * 0.8;
          // maxWidth squeezes a word into the box the browser gave it, so a missing or different font cannot shift the layout
          ctx.fillText(t, p.x, base, p.wd + 0.5);
          const ln = lines.find((l) => Math.abs(l.y - p.y) < 3 && p.x - l.x2 < size);
          if (ln) ln.x2 = p.x + p.wd; else lines.push({ x1: p.x, x2: p.x + p.wd, y: p.y });
        }
        if (deco !== "none" && /underline|line-through/.test(deco)) {
          const th = Math.max(1, size / 16); const h = pieces[0].h;
          for (const l of lines) { const y = /underline/.test(deco) ? l.y + h - size * 0.1 - th : l.y + h / 2; ctx.fillRect(l.x1, y, l.x2 - l.x1, th); }
        }
      }) });
    }
  }
  for (const pass of [false, true]) for (const d of draws) if (d.late === pass) d.run();
  return { canvas, left, top, width: w, height: h, scale, ms: performance.now() - t0 };
}
