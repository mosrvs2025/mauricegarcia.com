import Link from "next/link";
import { formatDate, projectById } from "@/lib/content/query";
import { renderMarkdown } from "@/lib/content/markdown";
import type { Post, Update } from "@/lib/content/schemas";
import { isProposed } from "@/lib/content/visibility";
import { Proposed } from "./ProjectParts";
import { ReadSignal } from "./ReadSignal";

const Banner = ({ status }: { status: string }) => status === "draft" ? <div className="j-banner" role="status">Draft preview: this is not public.</div> : null;

export function PostArticle({ post, preview = false, resolveProject = projectById }: { post: Post | (Omit<Post, "readingMinutes"> & { readingMinutes?: number }); preview?: boolean; resolveProject?: typeof projectById }) {
  const related = post.projectIds.map((id) => resolveProject(id)).filter(Boolean);
  return (
    <>
      {preview && <Banner status={post.status} />}
      <article className="j-wrap-narrow j-article">
        <header className="j-page-head" style={{ paddingInline: 0 }}>
          <p className="eyebrow">{post.kind}</p>
          <h1 className="display">{post.title}</h1>
          <p className="lede">{post.description}</p>
          <p className="j-meta" style={{ marginTop: 18 }}>
            {post.publishedAt ? <time dateTime={post.publishedAt}>Published {formatDate(post.publishedAt)}</time> : <span>Not yet published</span>}
            {post.updatedAt && <time dateTime={post.updatedAt}>Edited {formatDate(post.updatedAt)}</time>}
            {post.readingMinutes ? <span>{post.readingMinutes} min read</span> : null}
            {isProposed(post) && <Proposed />}
          </p>
        </header>
        <div className="j-prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
        {!preview && <ReadSignal slug={post.slug} />}
        <footer style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--j-line)" }}>
          {post.tags.length > 0 && <p className="j-tags" style={{ marginBottom: 16 }}>{post.tags.map((t) => <span className="j-tag" key={t}>{t}</span>)}</p>}
          {related.length > 0 && <p>Related: {related.map((p, i) => <span key={p!.id}>{i > 0 && ", "}<Link className="j-link" href={`/projects/${p!.slug}`}>{p!.title}</Link></span>)}</p>}
          <p style={{ marginTop: 12 }} className="j-muted">Follow along by <a className="j-link" href="/writing/rss.xml" data-track="feed_click" data-track-feed="writing">RSS</a>, or <Link className="j-link" href="/connect">write to me</Link>.</p>
        </footer>
      </article>
    </>
  );
}

export function UpdateArticle({ update, preview = false, resolveProject = projectById }: { update: Update; preview?: boolean; resolveProject?: typeof projectById }) {
  const project = resolveProject(update.projectId);
  return (
    <>
      {preview && <Banner status={update.status} />}
      <article className="j-wrap-narrow j-article">
        <header className="j-page-head" style={{ paddingInline: 0 }}>
          <p className="eyebrow">Update · {update.kind.replace(/-/g, " ")}</p>
          <h1 className="display">{update.title}</h1>
          <p className="lede">{update.summary}</p>
          <p className="j-meta" style={{ marginTop: 18 }}>
            <time dateTime={update.eventAt}>Happened {formatDate(update.eventAt)}</time>
            {update.publishedAt && <time dateTime={update.publishedAt}>Posted {formatDate(update.publishedAt)}</time>}
            {project && <Link className="j-link" href={`/projects/${project.slug}`}>{project.title}</Link>}
            {isProposed(update) && <Proposed />}
          </p>
        </header>
        <div className="j-prose">
          {update.whyCare && <p><strong>Why it matters.</strong> {update.whyCare}</p>}
          {update.limitations && <p><strong>Limits.</strong> {update.limitations}</p>}
          {update.body && <div dangerouslySetInnerHTML={{ __html: renderMarkdown(update.body) }} />}
          {update.evidence.length > 0 && <p><strong>Evidence.</strong> {update.evidence.map((e, i) => <span key={e.url}>{i > 0 && ", "}<a href={e.url} rel="noopener noreferrer">{e.label}</a></span>)}</p>}
        </div>
        <footer style={{ marginTop: 40 }} className="j-muted">
          <p>{update.provenance.origin === "manual" ? "Written by me." : update.provenance.editedByOwner ? "Started as an automated note and edited by me." : "Started as an automated note from the project's repository."}</p>
          <p style={{ marginTop: 10 }}><Link className="j-link" href="/updates">All updates</Link> · <a className="j-link" href="/updates/rss.xml" data-track="feed_click" data-track-feed="updates">RSS</a></p>
        </footer>
      </article>
    </>
  );
}
