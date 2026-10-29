import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { formatDate, lessonBySlug, projectById, shownLessons } from "@/lib/content/query";
import { renderMarkdown } from "@/lib/content/markdown";
import { isListed } from "@/lib/content/visibility";

// With no lessons yet there are no params; unknown slugs 404 instead of rendering.
export const dynamicParams = false;
export const generateStaticParams = () => shownLessons().map((l) => ({ slug: l.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const l = lessonBySlug((await params).slug);
  if (!l) return {};
  return {
    title: l.title, description: l.summary, alternates: { canonical: `/learn/${l.slug}` },
    robots: isListed(l) ? undefined : { index: false, follow: false },
    openGraph: { type: "article", title: l.title, description: l.summary, url: `/learn/${l.slug}`, publishedTime: l.publishedAt },
    twitter: { card: "summary_large_image", title: l.title, description: l.summary },
  };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const l = lessonBySlug((await params).slug);
  if (!l) notFound();
  const related = l.projectIds.map((id) => projectById(id)).filter(Boolean);
  return (
    <article className="j-wrap-narrow j-article">
      <header className="j-page-head" style={{ paddingInline: 0 }}>
        <p className="eyebrow"><Link href="/learn" className="j-link">Learn</Link> / {l.kind.replace("-", " ")} / {l.level}</p>
        <h1 className="display">{l.title}</h1>
        <p className="lede">{l.summary}</p>
        <p className="j-meta" style={{ marginTop: 18 }}>
          {l.publishedAt && <time dateTime={l.publishedAt}>Published {formatDate(l.publishedAt)}</time>}
          {l.minutes && <span>{l.minutes} min</span>}
          {l.tools.length > 0 && <span>Uses: {l.tools.join(", ")}</span>}
        </p>
      </header>
      {l.youtubeId && <YouTubeEmbed id={l.youtubeId} title={l.title} slug={l.slug} />}
      {l.body && <div className="j-prose" style={{ marginTop: 28 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(l.body) }} />}
      {related.length > 0 && <p style={{ marginTop: 32 }}>Built in: {related.map((p, i) => <span key={p!.id}>{i > 0 && ", "}<Link className="j-link" href={`/projects/${p!.slug}`}>{p!.title}</Link></span>)}</p>}
      <aside className="j-callout" style={{ marginTop: 44 }}>
        <h2 className="display">Want a hand with this?</h2>
        <ul><li>Learn it live, on your own idea, at your level.</li><li>Or have me build it for you.</li></ul>
        <p className="j-actions" style={{ marginTop: 0 }}><Link className="btn btn-fill" href="/connect?intent=coaching">Learn with me</Link><Link className="btn btn-ghost" href="/connect?intent=paid-work">Have it built</Link></p>
      </aside>
    </article>
  );
}
