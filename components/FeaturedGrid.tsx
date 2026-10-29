import Link from "next/link";
import type { CSSProperties } from "react";
import type { ProjectCard } from "@/lib/content/cards";
import { THEME_COLORS } from "@/lib/themes";
import { PreviewMedia } from "./PreviewMedia";

/** Bento grid of the featured set. The first card is the big one. */
export function FeaturedGrid({ projects, headingId }: { projects: ProjectCard[]; headingId?: string }) {
  if (projects.length === 0) return null;
  return (
    <ul className="j-bento" aria-labelledby={headingId}>
      {projects.map((p, i) => (
        <li key={p.slug} className={`j-feat${i === 0 ? " big" : ""}`} data-card style={{ "--accent": THEME_COLORS[p.themes[0]], "--i": i } as CSSProperties}>
          <Link href={`/projects/${p.slug}`} className="j-feat-link">
            <div className="j-feat-media">
              <PreviewMedia title={p.title} image={p.image} preview={p.preview} priority={i === 0} sizes={i === 0 ? "(max-width:760px) 100vw, 66vw" : "(max-width:760px) 100vw, 33vw"} />
              {p.game && p.playable && <span className="j-play">Playable</span>}
            </div>
            <div className="j-feat-body">
              <div className="j-tags"><span className="j-tag state">{p.stateLabel}</span>{p.themeLabels.slice(0, 2).map((t) => <span className="j-tag" key={t}>{t}</span>)}{p.proposed && <span className="j-proposed">Proposed</span>}</div>
              <h3 className="display">{p.title}</h3>
              <p>{p.tagline}</p>
            </div>
          </Link>
          <CardLinks p={p} />
        </li>
      ))}
    </ul>
  );
}

export function CardLinks({ p }: { p: ProjectCard }) {
  if (!p.demo && !p.repo) return null;
  return (
    <div className="j-card-links">
      {p.demo && <a className={p.game ? "btn btn-fill j-playnow" : "j-link j-arrow"} href={p.demo} rel="noopener noreferrer" data-track="demo_visit" data-track-project={p.slug} aria-label={`${p.game ? "Play" : "Open"} ${p.title} (live site)`}>{p.game ? "▶ Play now" : "Live site"}</a>}
      {p.repo && <a className="j-link j-arrow" href={p.repo} rel="noopener noreferrer" data-track="source_click" data-track-project={p.slug} aria-label={`${p.title} on GitHub`}>GitHub</a>}
    </div>
  );
}
