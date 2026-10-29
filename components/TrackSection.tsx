import Link from "next/link";
import type { ProjectCard } from "@/lib/content/cards";
import { TRACK_LABELS } from "@/lib/content/query";
import { FeaturedGrid } from "./FeaturedGrid";
import { Reveal } from "./Reveal";

/** One portfolio track on the home page: a short statement of what it is, then its featured work. */
export function TrackSection({ track, projects, total, lead }: { track: "products" | "experiences" | "labs"; projects: ProjectCard[]; total: number; lead?: string }) {
  const t = TRACK_LABELS[track];
  if (projects.length === 0) return null;
  return (
    <section className="studio-wrap j-section" id={track} aria-labelledby={`${track}-h`}>
      <Reveal><div className="j-head">
        <div><p className="eyebrow">{t.title}</p><h2 className="display" id={`${track}-h`}>{lead ?? t.blurb}</h2></div>
        <Link href={`/projects?track=${track}`} className="j-link j-arrow">All {total} {t.title.toLowerCase()}</Link>
      </div></Reveal>
      <Reveal><FeaturedGrid projects={projects} headingId={`${track}-h`} /></Reveal>
    </section>
  );
}
