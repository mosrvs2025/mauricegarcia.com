import type { Metadata } from "next";
import Link from "next/link";
import { Proposed } from "@/components/ProjectParts";
import { formatDate, listedPosts } from "@/lib/content/query";
import { isProposed } from "@/lib/content/visibility";

export const metadata: Metadata = { title: "Writing", description: "Essays, tutorials and reflections, each one a durable piece I stand behind. Short progress notes live under Updates." };

export default function WritingPage() {
  const posts = listedPosts();
  return (
    <div className="studio-wrap">
      <header className="j-page-head">
        <p className="eyebrow">Writing</p>
        <h1 className="display">Longer pieces</h1>
        <p className="lede">Essays, tutorials and reflections that should still make sense next year. For short dated progress notes, see <Link className="j-link" href="/updates">Updates</Link>.</p>
        <p className="j-actions"><a className="j-link j-arrow" href="/writing/rss.xml" data-track="feed_click" data-track-feed="writing">Follow by RSS</a></p>
      </header>
      <div className="j-section" style={{ paddingTop: 24 }}>
        {posts.length === 0 ? <p className="j-empty">Nothing published here yet. The <a className="j-link" href="/updates/rss.xml">updates feed</a> is where new things appear first.</p> : (
          <ul className="j-updates">{posts.map((p) => (
            <li className="j-update" key={p.id}>
              <time dateTime={p.publishedAt}>{p.publishedAt ? formatDate(p.publishedAt) : ""}</time>
              <div><h2 className="display" style={{ fontSize: "1.5rem" }}><Link href={`/writing/${p.slug}`}>{p.title}</Link></h2><p>{p.description}</p>
                <p className="j-meta" style={{ marginTop: 10 }}><span>{p.kind}</span><span>{p.readingMinutes} min read</span>{p.tags.map((t) => <span key={t}>#{t}</span>)}{isProposed(p) && <Proposed />}</p></div>
            </li>))}</ul>
        )}
      </div>
    </div>
  );
}
