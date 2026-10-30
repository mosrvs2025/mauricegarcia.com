"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Level = {
  slug: string; title: string; tagline: string; state: string; stateLabel: string; stateHelp: string;
  demo?: string; featured: boolean; game: boolean; image?: string; imageAlt: string;
};
type World = { id: string; title: string; blurb: string; levels: Level[] };

const STORE = "mg-game-visited";
const ROW = 118; // vertical distance between levels on the map
const BANNER = 150; // space reserved for each world's banner

/**
 * The whole portfolio as a level-select map. Arrow keys (or WASD) walk between levels, Enter opens one.
 * Everything here is ordinary links and buttons, so it also works with a screen reader, a mouse, or touch.
 */
export function GameWorld({ worlds }: { worlds: World[] }) {
  const flat = useMemo(() => worlds.flatMap((w) => w.levels.map((l) => ({ ...l, world: w.id }))), [worlds]);
  const [at, setAt] = useState(0);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const nodes = useRef<(HTMLButtonElement | null)[]>([]);
  const started = useRef(false);
  const primary = useRef<HTMLAnchorElement | null>(null);
  const [burst, setBurst] = useState(0);

  // Lay the levels out along a winding path, with a banner gap before each world.
  const layout = useMemo(() => {
    const pts: { x: number; y: number }[] = []; const banners: { y: number; world: World }[] = [];
    let y = 40; let i = 0;
    for (const w of worlds) {
      banners.push({ y, world: w }); y += BANNER;
      for (let k = 0; k < w.levels.length; k++, i++) { pts.push({ x: 50 + Math.sin(i * 0.85) * 30, y }); y += ROW; }
      y += 30;
    }
    return { pts, banners, height: y + 40 };
  }, [worlds]);

  const path = useMemo(() => layout.pts.reduce((d, p, i, a) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const q = a[i - 1]; const my = (q.y + p.y) / 2;
    return `${d} C ${q.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
  }, ""), [layout]);

  useEffect(() => {
    try { setVisited(new Set(JSON.parse(localStorage.getItem(STORE) || "[]"))); } catch {}
  }, []);

  const markVisited = useCallback((slug: string) => {
    setVisited((v) => {
      const n = new Set(v); n.add(slug);
      try { localStorage.setItem(STORE, JSON.stringify([...n])); } catch {}
      return n;
    });
  }, []);

  const go = useCallback((i: number, focus = true) => {
    const n = Math.max(0, Math.min(flat.length - 1, i));
    if (n !== at) setBurst((b) => b + 1);
    setAt(n); started.current = true;
    if (focus) nodes.current[n]?.focus({ preventScroll: true });
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    nodes.current[n]?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [flat.length, at]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (["arrowdown", "arrowright", "s", "d"].includes(k)) { e.preventDefault(); go(at + 1); }
      else if (["arrowup", "arrowleft", "w", "a"].includes(k)) { e.preventDefault(); go(at - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, go]);

  const cur = flat[at];
  const world = cur?.world ?? "experiences";
  const progress = flat.length > 1 ? at / (flat.length - 1) : 0;
  const pos = layout.pts[at];
  const count = flat.filter((l) => visited.has(l.slug)).length;

  return (
    <div className={`gv gv-on-${world}`}>
      <div className="gv-sky" aria-hidden="true" />
      <header className="gv-hud">
        <div>
          <p className="gv-kicker">Maurice Garcia · Experience Engineer</p>
          <h1 className="gv-title">Choose your level</h1>
          <p className="gv-sub">Every project is a level. Walk the map with <kbd>↑</kbd><kbd>↓</kbd> or <kbd>W</kbd><kbd>S</kbd>, or tap a level. Tap it again to jump in.</p>
        </div>
        <div className="gv-stats" aria-live="polite">
          <span className="gv-stat"><b>{count}</b>/{flat.length} explored</span>
          <Link href="/" className="gv-exit">Exit to normal site</Link>
        </div>
      </header>

      <div className="gv-stage">
        <div className="gv-map" style={{ height: layout.height }}>
          <svg className="gv-path" viewBox={`0 0 100 ${layout.height}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={path} className="gv-path-bg" vectorEffect="non-scaling-stroke" />
            <path d={path} className="gv-path-lit" pathLength={1} style={{ strokeDashoffset: 1 - progress }} vectorEffect="non-scaling-stroke" />
            <path d={path} className="gv-path-fg" vectorEffect="non-scaling-stroke" />
          </svg>
          {layout.banners.map(({ y, world }) => (
            <div key={world.id} className={`gv-banner gv-w-${world.id}`} style={{ top: y }}>
              <h2>{world.title}</h2><p>{world.blurb}</p>
            </div>
          ))}
          <ol className="gv-levels">
            {flat.map((l, i) => (
              <li key={l.slug} style={{ top: layout.pts[i].y, left: `${layout.pts[i].x}%` }}>
                <button
                  ref={(el) => { nodes.current[i] = el; }}
                  type="button"
                  className={`gv-node gv-w-${l.world} ${l.featured ? "is-boss" : ""} ${visited.has(l.slug) ? "is-done" : ""} ${i === at ? "is-here" : ""}`}
                  aria-current={i === at ? "true" : undefined}
                  aria-label={`Level ${i + 1}: ${l.title}, ${l.stateLabel}${visited.has(l.slug) ? ", explored" : ""}`}
                  onClick={() => (i === at ? primary.current?.focus() : go(i))}
                  onFocus={() => setAt(i)}
                >
                  <span className="gv-num">{i + 1}</span>
                  {l.featured && <span className="gv-star" aria-hidden="true">★</span>}
                </button>
                <span className={`gv-label ${layout.pts[i].x > 50 ? "is-left" : ""}`} aria-hidden="true">{l.title}</span>
              </li>
            ))}
          </ol>
          {pos && <div className="gv-player" style={{ top: pos.y, left: `${pos.x}%` }} aria-hidden="true"><span>mg</span></div>}
          {pos && burst > 0 && (
            <div key={burst} className="gv-burst" style={{ top: pos.y, left: `${pos.x}%` }} aria-hidden="true">
              {Array.from({ length: 12 }, (_, k) => <i key={k} style={{ "--a": `${k * 30}deg`, "--d": `${38 + (k % 3) * 16}px` } as React.CSSProperties} />)}
            </div>
          )}
        </div>

        {cur && (
          <aside key={cur.slug} className="gv-card" aria-live="polite" aria-label="Selected level">
            {cur.image && <img src={cur.image} alt={cur.imageAlt} className="gv-shot" />}
            <p className="gv-card-kicker">Level {at + 1} · {worlds.find((w) => w.id === cur.world)?.title.split(": ")[1]}{cur.featured ? " · ★ Featured" : ""}</p>
            <h2 className="gv-card-title">{cur.title}</h2>
            <p className="gv-card-tag">{cur.tagline}</p>
            <p className={`gv-state gv-state-${cur.state}`} title={cur.stateHelp}><b>{cur.stateLabel}</b> {cur.stateHelp}</p>
            <div className="gv-actions">
              {cur.demo && <a ref={primary} className="gv-btn gv-btn-go" href={cur.demo} rel="noopener noreferrer" onClick={() => markVisited(cur.slug)} data-track="demo_visit" data-track-project={cur.slug}>{cur.game ? "▶ Play" : "▶ Try it live"}</a>}
              <Link ref={cur.demo ? undefined : primary} className={`gv-btn ${cur.demo ? "" : "gv-btn-go"}`} href={`/projects/${cur.slug}`} onClick={() => markVisited(cur.slug)}>Enter level</Link>
            </div>
            <p className="gv-hint">Tap the glowing level again, or press <kbd>Enter</kbd>, to jump in.</p>
            <div className="gv-nav">
              <button type="button" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Previous level">↑ Prev</button>
              <button type="button" onClick={() => go(at + 1)} disabled={at === flat.length - 1} aria-label="Next level">Next ↓</button>
            </div>
          </aside>
        )}
      </div>

      <footer className="gv-end">
        <h2>Final level: build something together</h2>
        <p>Have an idea that deserves its own world, or a business that needs custom software, automation or AI? Every project is scoped and quoted to the work.</p>
        <Link href="/connect?intent=paid-work" className="gv-btn gv-btn-go">Start a build</Link>
      </footer>
    </div>
  );
}
