import Link from "next/link";
import { THEME_COLORS } from "@/lib/themes";

export type TickerItem = { slug: string; title: string; theme: string; playable: boolean };

/** A slow marquee of every project. Pauses on hover or focus; with reduced motion it becomes a scrollable row. */
export function Ticker({ items }: { items: TickerItem[] }) {
  const row = (hidden: boolean) => items.map((p) => (
    <Link key={(hidden ? "d-" : "") + p.slug} href={`/projects/${p.slug}`} className="j-tick" tabIndex={hidden ? -1 : undefined} aria-hidden={hidden || undefined}>
      <i style={{ background: THEME_COLORS[p.theme] }} aria-hidden="true" />{p.title}{p.playable && <b>play</b>}
    </Link>
  ));
  return (
    <div className="j-ticker" role="region" aria-label="All projects">
      <div className="j-ticker-track">{row(false)}{row(true)}</div>
    </div>
  );
}
