"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { THEME_COLORS } from "@/lib/themes";

export type BrowserProject = { slug: string; title: string; tagline: string; themes: string[]; themeLabels: string[]; state: string; stateLabel: string; tier: "featured" | "archive"; image?: { src: string; alt: string }; lastChange?: string; proposed: boolean; playable: boolean; demo?: string; repo?: string };

/** Filtering is client-side over a small, public-only list. Without JavaScript, every project is rendered and linked. */
export function ProjectBrowser({ projects, themes }: { projects: BrowserProject[]; themes: { id: string; label: string }[] }) {
  const [theme, setTheme] = useState<string>("all");
  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const [playable, setPlayable] = useState(false);
  const states = useMemo(() => [...new Map(projects.map((p) => [p.state, p.stateLabel])).entries()], [projects]);
  const match = (p: BrowserProject) =>
    (theme === "all" || p.themes.includes(theme)) && (state === "all" || p.state === state) && (!playable || p.playable) &&
    (!q.trim() || `${p.title} ${p.tagline}`.toLowerCase().includes(q.trim().toLowerCase()));
  const shown = projects.filter(match);
  const Tile = ({ p, i }: { p: BrowserProject; i: number }) => (
    <li className={`j-tile${p.tier === "featured" ? " feat" : ""}`} style={{ "--accent": THEME_COLORS[p.themes[0]], "--i": i % 9 } as CSSProperties}>
      <Link href={`/projects/${p.slug}`} className="j-tile-link">
        <div className="j-tile-media">
          {p.image ? <Image src={p.image.src} alt={p.image.alt} width={600} height={375} sizes="(max-width:760px) 100vw, (max-width:1100px) 50vw, 33vw" loading="lazy" /> : <span className="j-tile-letter" aria-hidden="true">{p.title.slice(0, 1)}</span>}
          {p.playable && <span className="j-play">Playable</span>}
        </div>
        <div className="j-tile-body">
          <div className="j-tags"><span className="j-tag state">{p.stateLabel}</span>{p.proposed && <span className="j-proposed">Proposed</span>}</div>
          <h3 className="display">{p.title}</h3>
          <p>{p.tagline}</p>
        </div>
      </Link>
      {(p.demo || p.repo) && (
        <div className="j-actions j-tile-links" style={{ padding: "0 22px 22px" }}>
          {p.demo && <a className="j-link j-arrow" href={p.demo} rel="noopener noreferrer" data-track="demo_visit" data-track-project={p.slug}>Live site</a>}
          {p.repo && <a className="j-link j-arrow" href={p.repo} rel="noopener noreferrer" data-track="source_click" data-track-project={p.slug}>GitHub</a>}
        </div>
      )}
    </li>
  );
  return (
    <div>
      <div className="j-chips" role="group" aria-label="Filter by theme">
        {[{ id: "all", label: "Everything" }, ...themes].map((t) => <button key={t.id} type="button" aria-pressed={theme === t.id} onClick={() => setTheme(t.id)} style={t.id !== "all" ? ({ "--accent": THEME_COLORS[t.id] } as CSSProperties) : undefined}>{t.id !== "all" && <i aria-hidden="true" />}{t.label}</button>)}
        <button type="button" aria-pressed={playable} onClick={() => setPlayable(!playable)}>▶ Playable now</button>
      </div>
      <div className="j-search">
        <label className="sr-only" htmlFor="pq" style={{ position: "absolute", left: -9999 }}>Search projects</label>
        <input id="pq" type="search" placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="sr-only" htmlFor="ps" style={{ position: "absolute", left: -9999 }}>Filter by state</label>
        <select id="ps" value={state} onChange={(e) => setState(e.target.value)}><option value="all">Any state</option>{states.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
      </div>
      <p className="j-muted" id="project-count" role="status" aria-live="polite" style={{ marginBottom: 18 }}>{shown.length} {shown.length === 1 ? "project" : "projects"}</p>
      {shown.length > 0 ? <ul className="j-grid">{shown.map((p, i) => <Tile key={p.slug} p={p} i={i} />)}</ul> : <p className="j-empty">Nothing matches. Clear a filter, or <Link className="j-link" href="/connect">tell me what you were hoping to find</Link>.</p>}
    </div>
  );
}
