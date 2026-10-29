"use client";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import type { ProjectCard } from "@/lib/content/cards";
import { THEME_COLORS } from "@/lib/themes";
import { CardLinks } from "./FeaturedGrid";
import { PreviewMedia } from "./PreviewMedia";

export type BrowserProject = ProjectCard;

/**
 * Filtering is client-side over a small, public-only list. Without JavaScript, every project is rendered and linked.
 * With no filter set, featured projects are left out here because the bento above already shows them.
 */
export function ProjectBrowser({ projects, themes }: { projects: BrowserProject[]; themes: { id: string; label: string }[] }) {
  const [theme, setTheme] = useState<string>("all");
  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const [playable, setPlayable] = useState(false);
  const [client, setClient] = useState(false);
  const states = useMemo(() => [...new Map(projects.map((p) => [p.state, p.stateLabel])).entries()], [projects]);
  const filtering = theme !== "all" || state !== "all" || playable || client || q.trim() !== "";
  const match = (p: BrowserProject) =>
    (theme === "all" || p.themes.includes(theme)) && (state === "all" || p.state === state) && (!playable || p.playable) && (!client || p.client) &&
    (!q.trim() || `${p.title} ${p.tagline}`.toLowerCase().includes(q.trim().toLowerCase()));
  const shown = projects.filter((p) => match(p) && (filtering || p.tier !== "featured"));
  const hasClient = projects.some((p) => p.client);
  const reset = () => { setTheme("all"); setQ(""); setState("all"); setPlayable(false); setClient(false); };
  return (
    <div>
      <div className="j-chips" role="group" aria-label="Filter projects">
        {[{ id: "all", label: "Everything" }, ...themes].map((t) => <button key={t.id} type="button" aria-pressed={theme === t.id} onClick={() => setTheme(t.id)} style={t.id !== "all" ? ({ "--accent": THEME_COLORS[t.id] } as CSSProperties) : undefined}>{t.id !== "all" && <i aria-hidden="true" />}{t.label}</button>)}
        <button type="button" aria-pressed={playable} onClick={() => setPlayable(!playable)}>▶ Playable now</button>
        {hasClient && <button type="button" aria-pressed={client} onClick={() => setClient(!client)}>Client work</button>}
      </div>
      <div className="j-search">
        <label className="sr-only" htmlFor="pq" style={{ position: "absolute", left: -9999 }}>Search projects</label>
        <input id="pq" type="search" placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="sr-only" htmlFor="ps" style={{ position: "absolute", left: -9999 }}>Filter by state</label>
        <select id="ps" value={state} onChange={(e) => setState(e.target.value)}><option value="all">Any state</option>{states.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
      </div>
      <p className="j-muted" id="project-count" role="status" aria-live="polite" style={{ marginBottom: 18 }}>
        {filtering ? `${shown.length} ${shown.length === 1 ? "project matches" : "projects match"}` : `${shown.length} more projects, ordered by how much went into them and how recent they are`}
        {filtering && <> · <button type="button" className="j-linkbtn" onClick={reset}>Clear filters</button></>}
      </p>
      {shown.length > 0 ? (
        <ul className="j-grid">
          {shown.map((p, i) => (
            <li key={p.slug} className="j-tile" data-card style={{ "--accent": THEME_COLORS[p.themes[0]], "--i": i % 9 } as CSSProperties}>
              <Link href={`/projects/${p.slug}`} className="j-tile-link">
                <div className="j-tile-media">
                  <PreviewMedia title={p.title} image={p.image} preview={p.preview} sizes="(max-width:760px) 100vw, (max-width:1100px) 50vw, 33vw" />
                  {p.game && p.playable && <span className="j-play">Playable</span>}
                </div>
                <div className="j-tile-body">
                  <div className="j-tags"><span className="j-tag state">{p.stateLabel}</span>{p.proposed && <span className="j-proposed">Proposed</span>}</div>
                  <h3 className="display">{p.title}</h3>
                  <p>{p.tagline}</p>
                </div>
              </Link>
              <CardLinks p={p} />
            </li>
          ))}
        </ul>
      ) : <p className="j-empty">Nothing matches. <button type="button" className="j-linkbtn" onClick={reset}>Clear filters</button>, or <Link className="j-link" href="/connect">tell me what you were hoping to find</Link>.</p>}
    </div>
  );
}
