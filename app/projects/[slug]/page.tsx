import type { Metadata } from "next";
import { Gallery } from "@/components/Gallery";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Proposed, StateTag, UpdateItem } from "@/components/ProjectParts";
import { formatDate, projectBySlug, shownProjects, CHANNEL_LABELS, MATURITY_HELP, MATURITY_LABELS, THEME_LABELS, TRACK_LABELS, updatesForProject, postsForProject } from "@/lib/content/query";
import { isListed, isProposed } from "@/lib/content/visibility";
import { ldScript, projectLd } from "@/lib/jsonld";

export const dynamicParams = false;
export const generateStaticParams = () => shownProjects().map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = projectBySlug((await params).slug);
  if (!p) return {};
  return {
    title: p.title, description: p.tagline,
    alternates: { canonical: `/projects/${p.slug}` },
    robots: isListed(p) ? undefined : { index: false, follow: false },
    openGraph: { title: `${p.title} · Maurice Garcia`, description: p.tagline, type: "article", url: `/projects/${p.slug}` },
    twitter: { card: "summary_large_image", title: p.title, description: p.tagline },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = projectBySlug((await params).slug);
  if (!p) notFound();
  const updates = updatesForProject(p.id);
  const posts = postsForProject(p.id);
  return (
    <article className="studio-wrap j-article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(projectLd(p)) }} />
      <header className="j-page-head">
        <p className="eyebrow"><Link href="/projects" className="j-link">Projects</Link> / {p.themes.map((t) => THEME_LABELS[t]).join(" · ")}</p>
        <h1 className="display">{p.title}</h1>
        <p className="lede">{p.tagline}</p>
        <div className="j-tags" style={{ marginTop: 18 }}><StateTag project={p} />{isProposed(p) && <Proposed />}</div>
        {p.stateNote && <p className="j-muted" style={{ marginTop: 12, maxWidth: "40em" }}>{p.stateNote}</p>}
        <div className="j-actions">
          {p.links.demo && <a className="btn btn-fill" href={p.links.demo} rel="noopener noreferrer" data-track="demo_visit" data-track-project={p.slug}>{p.themes.includes("games") ? "▶ Play now" : "Live site"}</a>}
          {p.links.repo && <a className="btn btn-ghost" href={p.links.repo} rel="noopener noreferrer" data-track="source_click" data-track-project={p.slug}>See the source</a>}
          {p.links.other.map((l) => <a key={l.url} className="j-link j-arrow" href={l.url} rel="noopener noreferrer">{l.label}</a>)}
          <Link className="j-link j-arrow" href={`/connect?project=${p.slug}&intent=${p.involve.intent}`} data-track="project_to_contact" data-track-project={p.slug}>Talk to me about this</Link>
        </div>
      </header>

      <Gallery title={p.title} media={p.media} preview={p.preview} captured={p.preview?.capturedAt ? formatDate(p.preview.capturedAt) : p.media[0]?.capturedAt ? formatDate(p.media[0].capturedAt) : undefined} />

      <dl className="j-facts">
        <div><dt>Maturity</dt><dd>{MATURITY_LABELS[p.maturity]} <span className="j-muted">· {MATURITY_HELP[p.maturity]}</span></dd></div>
        <div><dt>Track</dt><dd><Link className="j-link" href={`/projects?track=${p.track}`}>{TRACK_LABELS[p.track].title}</Link></dd></div>
        {p.dates.lastChange && <div><dt>Last change</dt><dd>{formatDate(p.dates.lastChange)}{p.dates.lastChangeSource ? <span className="j-muted"> · {p.dates.lastChangeSource}</span> : null}</dd></div>}
        <div><dt>Page last reviewed</dt><dd>{formatDate(p.dates.reviewed)}</dd></div>
        {p.openTo.length > 0 && <div><dt>Open to</dt><dd>{p.openTo.map((c) => CHANNEL_LABELS[c]).join(", ")} <span className="j-muted">· conversations, not offers or claims of traction</span></dd></div>}
        {p.ai.assisted === "yes" && <div><dt>Built with</dt><dd>AI coding assistants. {p.ai.note}</dd></div>}
      </dl>

      <section className="j-block"><h2>The problem or experience</h2><p>{p.problem}</p></section>
      <section className="j-block"><h2>Who it's for</h2><p>{p.audience}</p></section>
      <section className="j-block"><h2>My contribution</h2><div><p>{p.contribution}</p>{p.upstream && <p style={{ marginTop: 12 }}><strong>Upstream work:</strong> built on <a className="j-link" href={p.upstream.url} rel="noopener noreferrer">{p.upstream.name}</a>{p.upstream.license ? ` (${p.upstream.license})` : ""}. {p.upstream.note}</p>}</div></section>
      {p.worksToday.length > 0 && <section className="j-block"><h2>What works today</h2><ul>{p.worksToday.map((w) => <li key={w}>{w}</li>)}</ul></section>}
      {p.caseStudy && (
        <section className="j-callout j-case" aria-labelledby="case-h">
          <p className="eyebrow">Case study</p>
          <h2 className="display" id="case-h">How it was built</h2>
          <ol className="j-case-steps">{p.caseStudy.approach.map((a) => <li key={a}>{a}</li>)}</ol>
          {p.caseStudy.decisions.length > 0 && <>
            <h3>Key decisions</h3>
            <dl className="j-case-decisions">{p.caseStudy.decisions.map((d) => <div key={d.choice}><dt>{d.choice}</dt><dd>{d.why}</dd></div>)}</dl>
          </>}
          {p.caseStudy.outcome && <><h3>Outcome</h3><p>{p.caseStudy.outcome}</p></>}
          <p className="j-muted" style={{ marginTop: 14, fontSize: ".85rem" }}>Source: {p.caseStudy.source}</p>
        </section>
      )}
      {p.limitations.length > 0 && <section className="j-block"><h2>Limitations</h2><ul>{p.limitations.map((w) => <li key={w}>{w}</li>)}</ul></section>}
      {p.evidence.length > 0 && <section className="j-block"><h2>Evidence</h2><ul>{p.evidence.map((e) => <li key={e.url}><a className="j-link" href={e.url} rel="noopener noreferrer">{e.label}</a>{e.verifiedAt ? <span className="j-muted"> · checked {formatDate(e.verifiedAt)}</span> : null}</li>)}</ul></section>}

      {updates.length > 0 && <section className="j-block"><h2>Updates</h2><ul className="j-updates">{updates.map((u) => <UpdateItem key={u.id} update={u} />)}</ul></section>}
      {posts.length > 0 && <section className="j-block"><h2>Writing</h2><ul>{posts.map((w) => <li key={w.id}><Link className="j-link" href={`/writing/${w.slug}`}>{w.title}</Link></li>)}</ul></section>}

      <section className="j-block"><h2>About this page</h2><p className="j-muted">{p.disclosure.note}{p.disclosure.documentedAt ? ` Documented ${formatDate(p.disclosure.documentedAt)}.` : ""}</p></section>

      <section className="j-callout" style={{ marginTop: 40 }} aria-labelledby="involve">
        <h2 className="display" id="involve">How you can get involved</h2>
        <p className="j-muted" style={{ marginBottom: 12 }}>{p.involve.headline}</p>
        <ul>{p.involve.asks.map((a) => <li key={a}>{a}</li>)}</ul>
        <Link className="btn btn-fill" href={`/connect?project=${p.slug}&intent=${p.involve.intent}`} data-track="project_to_contact" data-track-project={p.slug}>Write to me about {p.title}</Link>
      </section>
    </article>
  );
}
