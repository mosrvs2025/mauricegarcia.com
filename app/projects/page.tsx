import type { Metadata } from "next";
import { ProjectBrowser, type BrowserProject } from "@/components/ProjectBrowser";
import { listedProjects, STATE_LABELS, THEME_LABELS } from "@/lib/content/query";
import { isProposed } from "@/lib/content/visibility";

export const metadata: Metadata = {
  title: "Projects",
  description: "Tools, games and experiments I've built, with an honest state for each: what works today, what doesn't, and how you can help.",
};

export default function ProjectsPage() {
  const projects: BrowserProject[] = listedProjects().map((p) => ({
    slug: p.slug, title: p.title, tagline: p.tagline, themes: p.themes, themeLabels: p.themes.map((t) => THEME_LABELS[t]),
    state: p.state, stateLabel: STATE_LABELS[p.state], tier: p.tier, lastChange: p.dates.lastChange,
    image: p.media[0] ? { src: p.media[0].src, alt: p.media[0].alt } : undefined, proposed: isProposed(p), playable: !!p.links.demo,
  }));
  const used = new Set(projects.flatMap((p) => p.themes));
  const themes = Object.entries(THEME_LABELS).filter(([id]) => used.has(id)).map(([id, label]) => ({ id, label }));
  return (
    <div className="studio-wrap">
      <header className="j-page-head">
        <p className="eyebrow">Projects</p>
        <h1 className="display">Everything I've built, and where each one really stands</h1>
        <p className="lede">Every project says whether it's a prototype, a playable slice, a simulation or in use, with a date for the last real change. Open one for the problem, what works today, the limits, and how you could get involved.</p>
      </header>
      <div className="j-section" style={{ paddingTop: 24 }}><ProjectBrowser projects={projects} themes={themes} /></div>
    </div>
  );
}
