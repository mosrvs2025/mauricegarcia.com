/**
 * A one-off, approximate picture of a region of the page, painted straight to a canvas.
 *
 * It reads layout and computed styles only (backgrounds, borders, images, video, canvases and text word by word)
 * and never touches the DOM, so the real page can never be broken by it. It is deliberately not a screenshot
 * library: those choke on modern colour syntax and bundle a lot of code, and a faithful copy is not needed for
 * debris that is in the air for a second. Nothing here reads pixels back, so cross-origin images simply draw
 * (and are skipped if the browser refuses them) instead of tainting anything.
 */
const MAX_ELEMENTS = 2500;
const MAX_WORDS = 700;

const transparent = (c: string) => !c || c === "transparent" || /^rgba?\([^)]*[, /]\s*0(\.0+)?\s*\)$/.test(c) || /\/\s*0(\.0+)?\s*\)$/.test(c);

function pageBackground(): string {
  for (const el of [document.body, document.documentElement]) { const c = getComputedStyle(el).backgroundColor; if (!transparent(c)) return c; }
  return "#12100d";
}

type Info = { opacity: number; visible: boolean; late: boolean };

export function snapshotRegion(docLeft: number, docTop: number, width: number, height: number, scale: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width * scale)); canvas.height = Math.max(1, Math.ceil(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const vl = docLeft - window.scrollX, vt = docTop - window.scrollY; // region in viewport coordinates
  const vr = vl + width, vb = vt + height;
  ctx.scale(scale, scale);
  ctx.fillStyle = pageBackground(); ctx.fillRect(0, 0, width, height);
  ctx.translate(-vl, -vt);
  ctx.textBaseline = "middle";

  const info = new Map<Element, Info>();
  const infoFor = (el: Element): Info => {
    let i = info.get(el);
    if (i) return i;
    const cs = getComputedStyle(el);
    const parent = el.parentElement && el.parentElement !== document.documentElement ? infoFor(el.parentElement) : { opacity: 1, visible: true, late: false };
    i = {
      opacity: parent.opacity * (parseFloat(cs.opacity) || 0),
      visible: cs.display !== "none" && (cs.visibility === "visible" ? true : false) && parent.visible,
      late: parent.late || cs.position === "fixed" || cs.position === "sticky",
    };
    info.set(el, i);
    return i;
  };

  const draws: { late: boolean; run: () => void }[] = [];
  let words = 0;
  const range = document.createRange();
  const els = document.body.querySelectorAll("*");
  const limit = Math.min(els.length, MAX_ELEMENTS * 4);
  let seen = 0;
  for (let n = 0; n < limit && seen < MAX_ELEMENTS; n++) {
    const el = els[n] as HTMLElement;
    if (el.closest("[data-play]") || el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right < vl || r.left > vr || r.bottom < vt || r.top > vb) continue;
    seen++;
    const inf = infoFor(el);
    if (!inf.visible || inf.opacity < 0.02) continue;
    const cs = getComputedStyle(el);
    draws.push({ late: inf.late, run: () => paintElement(ctx, el, r, cs, inf.opacity) });
    // text directly inside this element
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType !== 3 || !node.nodeValue || !node.nodeValue.trim() || words > MAX_WORDS) continue;
      range.selectNodeContents(node);
      const nb = range.getBoundingClientRect();
      if (nb.right < vl || nb.left > vr || nb.bottom < vt || nb.top > vb) continue;
      const text = node.nodeValue; const pieces: { w: string; x: number; y: number; h: number }[] = [];
      const re = /\S+/g; let m: RegExpExecArray | null;
      while ((m = re.exec(text)) && words < MAX_WORDS) {
        range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length);
        const wr = range.getBoundingClientRect();
        if (wr.width === 0 || wr.right < vl || wr.left > vr || wr.bottom < vt || wr.top > vb) continue;
        pieces.push({ w: m[0], x: wr.left, y: wr.top, h: wr.height }); words++;
      }
      if (!pieces.length) continue;
      const color = cs.color; const alpha = inf.opacity;
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const tt = cs.textTransform; const ls = cs.letterSpacing;
      draws.push({ late: inf.late, run: () => {
        if (transparent(color)) return;
        ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.font = font;
        if ("letterSpacing" in ctx && ls !== "normal") (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = ls;
        for (const p of pieces) {
          const t = tt === "uppercase" ? p.w.toUpperCase() : tt === "lowercase" ? p.w.toLowerCase() : tt === "capitalize" ? p.w.charAt(0).toUpperCase() + p.w.slice(1) : p.w;
          ctx.fillText(t, p.x, p.y + p.h / 2);
        }
        ctx.restore();
      } });
    }
  }
  for (const pass of [false, true]) for (const d of draws) if (d.late === pass) { try { d.run(); } catch { /* one odd element never stops the blast */ } }
  return canvas;
}

function radii(cs: CSSStyleDeclaration, w: number, h: number): number {
  const v = cs.borderTopLeftRadius || "0";
  const first = v.split(" ")[0];
  const n = parseFloat(first) || 0;
  return Math.min(first.endsWith("%") ? (n / 100) * Math.min(w, h) : n, Math.min(w, h) / 2);
}

function paintElement(ctx: CanvasRenderingContext2D, el: HTMLElement, r: DOMRect, cs: CSSStyleDeclaration, opacity: number) {
  ctx.save(); ctx.globalAlpha = opacity;
  const rad = radii(cs, r.width, r.height);
  if (!transparent(cs.backgroundColor)) {
    ctx.fillStyle = cs.backgroundColor; ctx.beginPath();
    if (rad > 0 && "roundRect" in ctx) ctx.roundRect(r.left, r.top, r.width, r.height, rad); else ctx.rect(r.left, r.top, r.width, r.height);
    ctx.fill();
  }
  const sides: [string, string, string, number, number, number, number][] = [
    [cs.borderTopStyle, cs.borderTopColor, cs.borderTopWidth, r.left, r.top, r.width, 0],
    [cs.borderBottomStyle, cs.borderBottomColor, cs.borderBottomWidth, r.left, r.bottom, r.width, 1],
    [cs.borderLeftStyle, cs.borderLeftColor, cs.borderLeftWidth, r.left, r.top, 0, r.height],
    [cs.borderRightStyle, cs.borderRightColor, cs.borderRightWidth, r.right, r.top, 0, r.height],
  ];
  sides.forEach(([style, color, width, x, y, w, h], i) => {
    const bw = parseFloat(width);
    if (style === "none" || style === "hidden" || !bw || transparent(color)) return;
    ctx.fillStyle = color;
    if (i === 0) ctx.fillRect(x, y, w, bw); else if (i === 1) ctx.fillRect(x, y - bw, w, bw); else if (i === 2) ctx.fillRect(x, y, bw, h); else ctx.fillRect(x - bw, y, bw, h);
  });
  if (el instanceof HTMLImageElement && el.complete && el.naturalWidth) drawFitted(ctx, el, el.naturalWidth, el.naturalHeight, r, cs);
  else if (el instanceof HTMLVideoElement && el.readyState >= 2 && el.videoWidth) drawFitted(ctx, el, el.videoWidth, el.videoHeight, r, cs);
  else if (el instanceof HTMLCanvasElement && el.width && el.height) drawFitted(ctx, el, el.width, el.height, r, cs);
  ctx.restore();
}

/** object-fit: cover | contain | fill with a centred object-position, which is what the site uses. */
function drawFitted(ctx: CanvasRenderingContext2D, src: CanvasImageSource, iw: number, ih: number, r: DOMRect, cs: CSSStyleDeclaration) {
  const fit = cs.objectFit;
  ctx.save(); ctx.beginPath();
  const rad = radii(cs, r.width, r.height);
  if (rad > 0 && "roundRect" in ctx) ctx.roundRect(r.left, r.top, r.width, r.height, rad); else ctx.rect(r.left, r.top, r.width, r.height);
  ctx.clip();
  if (fit === "cover" || fit === "contain" || fit === "scale-down") {
    const k = fit === "cover" ? Math.max(r.width / iw, r.height / ih) : Math.min(r.width / iw, r.height / ih);
    const w = iw * k, h = ih * k;
    const [px, py] = cs.objectPosition.split(" ").map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : 0.5));
    ctx.drawImage(src, r.left + (r.width - w) * (px ?? 0.5), r.top + (r.height - h) * (py ?? 0.5), w, h);
  } else ctx.drawImage(src, r.left, r.top, r.width, r.height);
  ctx.restore();
}
