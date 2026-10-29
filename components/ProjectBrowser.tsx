"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type BrowserProject = { slug: string; title: string; tagline: string; themes: string[]; themeLabels: string[]; state: string; stateLabel: string; tier: "featured" | "archive"; image?: { src: string; alt: string }; lastChange?: string; proposed: boolean };

/** Filtering is client-side over a small, public-only list. Without JavaScript, every project is rendered and linked. */
export function ProjectBrowser({ projects, themes }: { projects: BrowserProject[]; themes: { id: string; label: string }[] }) {
  const [theme, setTheme] = useState<string>("all");
  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const states = useMemo(() => [...new Map(projects.map((p) => [p.state, p.stateLabel])).entries()], [projects]);
  const match = (p: BrowserProject) =>
    (theme === "all" || p.themes.includes(theme)) && (state === "all" || p.state === state) &&
    (!q.trim() || `${p.title} ${p.tagline}`.toLowerCase().includes(q.trim().toLowerCase()));
  const shown = projects.filter(match);
  const featured = shown.filter((p) => p.tier === "featured"); const archive = shown.filter((p) => p.tier === "archive");
  const Row = ({ p }: { p: BrowserProject }) => (
    <li className="j-row">
      <div className={`j-row-thumb${p.image ? "" : " empty"}`} aria-hidden={p.image ? undefined : true}>{p.image ? <Image src={p.image.src} alt={p.image.alt} width={192} height={128} sizes="96px" loading="lazy" /> : p.title.slice(0, 1)}</div>
      <div><h3 className="display"><Link href={`/projects/${p.slug}`}>{p.title}</Link></h3><p>{p.tagline}</p>{p.proposed && <p style={{ marginTop: 8 }}><span className="j-proposed">Proposed, awaiting approval</span></p>}</div>
      <div className="j-tags"><span className="j-tag state">{p.stateLabel}</span></div>
    </li>
  );
  return (
    <div>
      <div className="j-chips" role="group" aria-label="Filter by theme">
        {[{ id: "all", label: "Everything" }, ...themes].map((t) => <button key={t.id} type="button" aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}>{t.label}</button>)}
      </div>
      <div className="j-search">
        <label className="sr-only" htmlFor="pq" style={{ position: "absolute", left: -9999 }}>Search projects</label>
        <input id="pq" type="search" placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="sr-only" htmlFor="ps" style={{ position: "absolute", left: -9999 }}>Filter by state</label>
        <select id="ps" value={state} onChange={(e) => setState(e.target.value)}><option value="all">Any state</option>{states.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
      </div>
      <p className="j-muted" role="status" aria-live="polite" style={{ marginBottom: 12 }}>{shown.length} {shown.length === 1 ? "project" : "projects"}</p>
      {featured.length > 0 && <><h2 className="eyebrow" style={{ marginTop: 16 }}>Featured</h2><ul className="j-rows" style={{ listStyle: "none" }}>{featured.map((p) => <Row key={p.slug} p={p} />)}</ul></>}
      {archive.length > 0 && <><h2 className="eyebrow" style={{ marginTop: 40 }}>Archive</h2><ul className="j-rows" style={{ listStyle: "none" }}>{archive.map((p) => <Row key={p.slug} p={p} />)}</ul></>}
      {shown.length === 0 && <p className="j-empty">Nothing matches. Clear a filter, or <Link className="j-link" href="/connect">tell me what you were hoping to find</Link>.</p>}
    </div>
  );
}
