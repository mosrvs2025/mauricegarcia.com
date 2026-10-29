import type { Metadata } from "next";
import { UpdateItem } from "@/components/ProjectParts";
import { listedUpdates, projectById } from "@/lib/content/query";

export const metadata: Metadata = { title: "Updates", description: "Short dated notes on real progress: what changed, why it matters, and what's still unfinished." };

export default function UpdatesPage() {
  const updates = listedUpdates();
  return (
    <div className="studio-wrap">
      <header className="j-page-head">
        <p className="eyebrow">Updates</p>
        <h1 className="display">What changed, and why you might care</h1>
        <p className="lede">Dates here are when the work happened, not when I got around to posting. Each note says what is still unfinished. Longer pieces are under Writing.</p>
        <p className="j-actions"><a className="j-link j-arrow" href="/updates/rss.xml" data-track="feed_click" data-track-feed="updates">Follow by RSS</a></p>
      </header>
      <div className="j-section" style={{ paddingTop: 24 }}>
        {updates.length === 0 ? <p className="j-empty">No updates published yet.</p> : (
          <ul className="j-updates">{updates.map((u) => { const p = projectById(u.projectId); return <UpdateItem key={u.id} update={u} projectTitle={p?.title} projectSlug={p?.slug} />; })}</ul>
        )}
      </div>
    </div>
  );
}
