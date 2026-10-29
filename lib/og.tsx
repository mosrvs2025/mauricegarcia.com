import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

/** Text-only social card: no remote fonts or images, so it builds offline and never leaks anything not in the page. */
export function ogImage({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#12100d", color: "#f3ede3", padding: 72 }}>
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#ff7a4d" }}>{kicker}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: title.length > 40 ? 64 : 88, lineHeight: 1.05, fontWeight: 700 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 34, lineHeight: 1.35, color: "#b9b0a2" }}>{subtitle.length > 150 ? subtitle.slice(0, 147) + "…" : subtitle}</div> : null}
        </div>
        <div style={{ fontSize: 30, color: "#b9b0a2" }}>Maurice Garcia · mauricegarcia.com</div>
      </div>
    ),
    ogSize,
  );
}
