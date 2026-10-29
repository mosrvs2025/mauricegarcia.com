import type { Metadata } from "next";
import { Suspense } from "react";
import { FeaturedGrid } from "@/components/FeaturedGrid";
import { ProjectBrowser } from "@/components/ProjectBrowser";
import { toCard } from "@/lib/content/cards";
import { featuredProjects, listedProjects, MATURITY_HELP, MATURITY_LABELS, TRACK_LABELS } from "@/lib/content/query";

export const metadata: Metadata = {
  title: "Projects",
  description: "Products, interactive experiences and experimental labs, each labelled production, beta, prototype or concept, with what works today and what doesn't.",
};

export default function ProjectsPage() {
  const projects = listedProjects().map(toCard);
  const featured = featuredProjects().map(toCard);
  const tracks = Object.entries(TRACK_LABELS).map(([id, t]) => ({ id, label: t.title }));
  return (
    <div className="studio-wrap">
      <header className="j-page-head">
        <p className="eyebrow">Projects</p>
        <h1 className="display">Practical products and ambitious experiments</h1>
        <p className="lede">Three tracks: <strong>products</strong> with a clear user and a business case, <strong>experiences</strong> built to be played, and <strong>labs</strong> that test what&apos;s possible. Every project says honestly how finished it is.</p>
        <dl className="j-legend" aria-label="What the maturity labels mean">
          {Object.entries(MATURITY_LABELS).map(([id, label]) => <div key={id}><dt><span className="j-tag state">{label}</span></dt><dd>{MATURITY_HELP[id]}</dd></div>)}
        </dl>
      </header>
      {featured.length > 0 && (
        <section className="j-section" style={{ paddingTop: 24 }} aria-labelledby="feat-h">
          <div className="j-head"><div><p className="eyebrow">Start here</p><h2 className="display" id="feat-h">The work I&apos;d show first</h2></div></div>
          <p className="j-muted j-hint">Chosen by judgment, not by commit counts: how sophisticated and original it is, whether it really works, its business value, how well it&apos;s presented, and any verified real-world use. Cards with a ▶ Preview badge play a few seconds from the live site when you hover, focus or scroll to them.</p>
          <FeaturedGrid projects={featured} headingId="feat-h" />
        </section>
      )}
      <section className="j-section" style={{ paddingTop: 24 }} aria-labelledby="all-h">
        <h2 className="display j-subhead" id="all-h">Everything else</h2>
        <Suspense fallback={<p className="j-muted">Loading projects…</p>}><ProjectBrowser projects={projects} tracks={tracks} /></Suspense>
      </section>
    </div>
  );
}
