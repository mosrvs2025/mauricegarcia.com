import type { Metadata } from "next";
import Link from "next/link";
import { Proposed } from "@/components/ProjectParts";
import { formatDate, projectById, shownNow } from "@/lib/content/query";
import { isProposed } from "@/lib/content/visibility";

export const metadata: Metadata = { title: "Now", description: "A deliberately edited snapshot of what I'm focused on, what I'm curious about, and what kinds of connection I'd welcome." };

export default function NowPage() {
  const now = shownNow();
  return (
    <div className="j-wrap-narrow j-article">
      <header className="j-page-head" style={{ paddingInline: 0 }}>
        <p className="eyebrow">Now</p>
        <h1 className="display">What I'm focused on</h1>
        {now ? (
          <p className="j-meta" style={{ marginTop: 18 }}>
            {now.reviewedBy === "owner" ? <span>Last reviewed by me on <time dateTime={now.reviewedAt}>{formatDate(now.reviewedAt)}</time></span> : <span>Drafted {formatDate(now.reviewedAt)}, not yet reviewed by me</span>}
            {isProposed(now) && <Proposed />}
          </p>
        ) : null}
        <p className="j-muted" style={{ marginTop: 12 }}>This page changes when I edit it, not when I push code, so it can lag behind what's in the repositories.</p>
      </header>
      {!now ? <p className="j-empty">I haven't published a Now snapshot yet. The <Link className="j-link" href="/updates">updates</Link> show recent progress in the meantime.</p> : (
        <div className="j-prose">
          <p style={{ fontSize: "1.3rem" }} className="display">{now.focus}</p>
          {now.building.length > 0 && <><h2>Building</h2><ul>{now.building.map((b) => { const p = projectById(b.projectId); return <li key={b.text}>{b.text}{p && <> <Link href={`/projects/${p.slug}`}>({p.title})</Link></>}</li>; })}</ul></>}
          {now.exploring.length > 0 && <><h2>Exploring</h2><ul>{now.exploring.map((e) => <li key={e}>{e}</li>)}</ul></>}
          {now.welcome.length > 0 && <><h2>Opportunities and connections I'd welcome</h2><ul>{now.welcome.map((w) => <li key={w.text}>{w.text} <Link href={`/connect?intent=${w.intent}`}>Write to me</Link></li>)}</ul></>}
        </div>
      )}
    </div>
  );
}
