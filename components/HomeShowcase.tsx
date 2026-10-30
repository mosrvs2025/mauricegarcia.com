"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProjectCard } from "@/lib/content/cards";
import { PreviewMedia } from "./PreviewMedia";

/** A deliberately manual reel: visitors choose the work; nothing advances under their pointer. */
export function HomeShowcase({ projects }: { projects: ProjectCard[] }) {
  const [selected, setSelected] = useState(0);
  const p = projects[selected];
  if (!p) return null;
  return (
    <div className="home-showcase" aria-label="Featured project previews">
      <div className="showcase-chrome"><span><i /> Selected work</span><span>0{selected + 1} / 0{projects.length}</span></div>
      <div className="showcase-project" data-card key={p.slug}>
        <Link className="showcase-screen" href={`/projects/${p.slug}`} aria-label={`Explore ${p.title}`}>
          <PreviewMedia title={p.title} image={p.image} preview={p.preview} sizes="(max-width:900px) 100vw, 52vw" priority />
          <span className="showcase-view">Explore project ↗</span>
        </Link>
        <div className="showcase-caption" aria-live="polite" aria-atomic="true">
          <div><p className="eyebrow">{p.track} / {p.stateLabel}</p><h2 className="display"><Link href={`/projects/${p.slug}`}>{p.title}</Link></h2></div>
          {p.demo && <a className="showcase-launch" href={p.demo} aria-label={`Open ${p.title} live demo`} data-track="demo_visit" data-track-project={p.slug}>Try it live ↗</a>}
        </div>
      </div>
      <div className="showcase-selector" role="group" aria-label="Choose a project preview">
        {projects.map((project, i) => <button key={project.slug} type="button" aria-pressed={selected === i} onClick={() => setSelected(i)}><span>0{i + 1}</span>{project.title}<span aria-hidden="true">↗</span></button>)}
      </div>
      <p className="showcase-note">Actual project captures. Hover or focus to preview.</p>
    </div>
  );
}
