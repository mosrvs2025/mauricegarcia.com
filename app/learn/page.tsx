import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { listedLessons } from "@/lib/content/query";
import { formatDate } from "@/lib/content/query";
import { youtubeChannelUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Learn",
  description: "Practical ways to build useful things with AI, using whichever models and tools fit, even from very little programming experience.",
};

const formats = [
  ["Tutorials", "Step-by-step: build one small useful thing from nothing."],
  ["Videos", "Screen recordings of real builds, including the wrong turns."],
  ["Walkthroughs", "How an existing project of mine was made, decision by decision."],
  ["Project breakdowns", "What worked, what broke and what I'd do differently."],
  ["Resources", "Prompts, checklists and templates you can reuse."],
];

export default function LearnPage() {
  const lessons = listedLessons();
  const channel = youtubeChannelUrl();
  const levels = ["beginner", "intermediate", "advanced"] as const;
  return (
    <div className="studio-wrap" style={{ paddingBottom: 80 }}>
      <header className="j-page-head">
        <p className="eyebrow">Learn</p>
        <h1 className="display">Learn to build useful things with AI</h1>
        <p className="lede">I use several AI models, tools, frameworks and workflows, and I pick whatever fits the job. This section teaches the thinking and the process, so it works with whatever you use. You don&apos;t need to know how to code to start.</p>
        <p className="j-actions">
          <Link className="btn btn-fill j-shine" href="/connect?intent=coaching">Learn with me, one-to-one</Link>
          {channel && <a className="btn btn-ghost" href={channel} rel="noopener noreferrer" data-track="feed_click" data-track-feed="youtube">Watch on YouTube</a>}
          <a className="j-link j-arrow" href="/learn/rss.xml" data-track="feed_click" data-track-feed="learn">Follow by RSS</a>
        </p>
      </header>

      <section className="j-section" style={{ paddingTop: 24 }} aria-labelledby="formats-h">
        <Reveal><div className="j-head"><div><p className="eyebrow">What goes here</p><h2 className="display" id="formats-h">Five kinds of lesson</h2></div></div></Reveal>
        <ul className="j-caps">{formats.map(([t, d], i) => <Reveal as="li" key={t} delay={i * 50} className="j-cap-wrap"><div className="j-cap"><h3 className="display">{t}</h3><p>{d}</p></div></Reveal>)}</ul>
      </section>

      <section className="j-section" aria-labelledby="lessons-h">
        <div className="j-head"><div><p className="eyebrow">The library</p><h2 className="display" id="lessons-h">{lessons.length ? "Lessons" : "The first lessons are on their way"}</h2></div></div>
        {lessons.length === 0 ? (
          <div className="j-empty">
            <p>Nothing is published yet, and I&apos;d rather say that than fill this page with filler. New lessons appear here and in <Link className="j-link" href="/updates">Updates</Link> as soon as they&apos;re real. Follow by <a className="j-link" href="/learn/rss.xml">RSS</a>, or tell me what you&apos;d most like to learn first.</p>
            <p style={{ marginTop: 14 }}><Link className="btn btn-ghost" href="/connect?intent=coaching">Tell me what you want to learn</Link></p>
          </div>
        ) : levels.map((lv) => {
          const group = lessons.filter((l) => l.level === lv);
          if (!group.length) return null;
          return (
            <div key={lv} style={{ marginBottom: 36 }}>
              <h3 className="eyebrow" style={{ marginBottom: 12 }}>{lv}</h3>
              <ul className="j-updates">{group.map((l) => (
                <li key={l.id} className="j-update"><time dateTime={l.publishedAt}>{l.publishedAt ? formatDate(l.publishedAt) : ""}</time>
                  <div><h3 className="display"><Link href={`/learn/${l.slug}`}>{l.title}</Link></h3><p>{l.summary}</p>
                    <p className="j-meta" style={{ marginTop: 10 }}><span>{l.kind.replace("-", " ")}</span>{l.minutes && <span>{l.minutes} min</span>}{l.tools.map((t) => <span key={t}>{t}</span>)}</p></div></li>
              ))}</ul>
            </div>
          );
        })}
      </section>

      <section className="j-section" aria-labelledby="path-h">
        <div className="j-head"><div><p className="eyebrow">Go further</p><h2 className="display" id="path-h">When you want it done, or done faster</h2></div></div>
        <div className="j-split">
          <div className="j-panel"><h3 className="display">Learn live, on your own idea</h3><p>A hands-on session where we build a small part of your project together, at your level, with whichever tools you prefer.</p><div className="actions"><Link className="btn btn-ghost" href="/coaching">How coaching works</Link></div></div>
          <div className="j-panel"><h3 className="display">Have it built for you</h3><p>If you&apos;d rather not do it yourself, I&apos;ll build it. Scope and price are agreed first, as a custom quote.</p><div className="actions"><Link className="btn btn-ghost" href="/connect?intent=paid-work">Start a build</Link></div></div>
        </div>
      </section>
    </div>
  );
}
