import type { Metadata } from "next";
import { FeaturedGrid } from "@/components/FeaturedGrid";
import { ProjectBrowser } from "@/components/ProjectBrowser";
import { toCard } from "@/lib/content/cards";
import { featuredProjects, listedProjects, THEME_LABELS } from "@/lib/content/query";

export const metadata: Metadata = {
  title: "Projects",
  description: "Tools, games and experiments I've built, with an honest state for each: what works today, what doesn't, and how you can help.",
};

export default function ProjectsPage() {
  const projects = listedProjects().map(toCard);
  const featured = featuredProjects().map(toCard);
  const used = new Set(projects.flatMap((p) => p.themes));
  const themes = Object.entries(THEME_LABELS).filter(([id]) => used.has(id)).map(([id, label]) => ({ id, label }));
  return (
    <div className="studio-wrap">
      <header className="j-page-head">
        <p className="eyebrow">Projects</p>
        <h1 className="display">Everything I've built, and where each one really stands</h1>
        <p className="lede">Every project says whether it's a prototype, a playable slice, a simulation or in use, with a date for the last real change. Open one for the problem, what works today, the limits, and how you could get involved.</p>
      </header>
      {featured.length > 0 && (
        <section className="j-section" style={{ paddingTop: 24 }} aria-labelledby="feat-h">
          <div className="j-head"><div><p className="eyebrow">Start here</p><h2 className="display" id="feat-h">The ones I&apos;ve put the most into</h2></div></div>
          <p className="j-muted j-hint">Each card with a ▶ Preview badge plays a few seconds recorded from the live site when you hover, focus or scroll to it.</p>
          <FeaturedGrid projects={featured} headingId="feat-h" />
        </section>
      )}
      <section className="j-section" style={{ paddingTop: 24 }} aria-labelledby="all-h">
        <h2 className="display j-subhead" id="all-h">Everything else</h2>
        <ProjectBrowser projects={projects} themes={themes} />
      </section>
    </div>
  );
}
