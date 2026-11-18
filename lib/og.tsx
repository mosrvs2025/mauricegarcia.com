import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

export const OG_ACCENTS: Record<string, string> = { products: "#C73723", experiences: "#255E79", labs: "#5E6B14", default: "#C73723" };

/** Small deterministic hash so every page gets its own pattern, stable across builds. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
}

/**
 * Social card with a generative "fingerprint" grid: the homepage's square field, seeded by the page,
 * so no two shared links look the same. Text and shapes only: no remote fonts or images.
 */
export function ogImage({ kicker, title, subtitle, seed, accent = OG_ACCENTS.default, badge }: { kicker: string; title: string; subtitle?: string; seed?: string; accent?: string; badge?: string }) {
  const rnd = hash(seed ?? title);
  const cols = 7, rows = 9, cell = 50, gap = 8;
  const cells = Array.from({ length: cols * rows }, (_, i) => {
    const r = rnd(); const c = i % cols; const fade = 0.25 + (c / cols) * 0.75;
    return r > 0.86 ? { bg: accent, o: 1, glow: true } : r > 0.68 ? { bg: accent, o: 0.28 * fade, glow: false } : { bg: "#181B1C", o: 0.07 * fade, glow: false };
  });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F2F0EA", color: "#181B1C", position: "relative" }}>
        <div style={{ position: "absolute", left: 72, top: 0, width: 96, height: 10, background: accent, display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 0 60px 72px", width: 740 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", fontSize: 54, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>mg<svg width="26" height="26" viewBox="0 0 24 24" style={{ marginLeft: 3 }}><g stroke={accent} strokeWidth="3.2" strokeLinecap="round"><path d="M12 2v20" /><path d="M3.3 7l17.4 10" /><path d="M3.3 17l17.4-10" /></g></svg></div>
            <div style={{ width: 2, height: 36, background: "#C8CAC5", display: "flex" }} />
            <div style={{ fontSize: 22, letterSpacing: 5, textTransform: "uppercase", color: accent }}>{kicker}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ fontSize: title.length > 26 ? 66 : 92, lineHeight: 1, fontWeight: 800, letterSpacing: -3 }}>{title}</div>
            {subtitle ? <div style={{ fontSize: 30, lineHeight: 1.35, color: "#4B5254", maxWidth: 640 }}>{subtitle.length > 120 ? subtitle.slice(0, 117) + "…" : subtitle}</div> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, color: "#4B5254" }}>
            {badge ? <div style={{ display: "flex", padding: "8px 18px", borderRadius: 999, border: `2px solid ${accent}`, color: accent, fontWeight: 700 }}>{badge}</div> : null}
            <div style={{ display: "flex" }}>{badge ? "Maurice Garcia · mauricegarcia.com" : "Maurice Garcia · Experience Engineer · mauricegarcia.com"}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", width: cols * (cell + gap), gap, alignContent: "center", marginLeft: 20, transform: "rotate(-8deg)" }}>
          {cells.map((c, i) => (
            <div key={i} style={{ width: cell, height: cell, borderRadius: 2, background: c.bg, opacity: c.o, display: "flex", boxShadow: "none" }} />
          ))}
        </div>
      </div>
    ),
    ogSize,
  );
}
