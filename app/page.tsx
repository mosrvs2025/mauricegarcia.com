import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CountUp } from "@/components/CountUp";
import { ProjectLead, ProjectRow, Proposed, UpdateItem } from "@/components/ProjectParts";
import { Reveal } from "@/components/Reveal";
import { SurpriseMe } from "@/components/SurpriseMe";
import { Ticker } from "@/components/Ticker";
import { featuredProjects, formatDate, listedPosts, listedProjects, listedUpdates, projectById, shownNow } from "@/lib/content/query";
import { isProposed } from "@/lib/content/visibility";
import { site } from "@/lib/site";

// The animated grid is decorative: load it after the page is interactive so it never delays first paint.
const HeroField = dynamic(() => import("@/components/HeroField").then((m) => m.HeroField));

export default function HomePage() {
  const all = listedProjects();
  const featured = featuredProjects();
  const lead = featured.find((p) => p.media[0]) ?? featured[0];
  const rest = featured.filter((p) => p !== lead);
  const now = shownNow();
  const updates = listedUpdates().slice(0, 3);
  const posts = listedPosts().slice(0, 2);
  const withDemo = all.filter((p) => p.links.demo);
  const demos = withDemo.map((p) => ({ title: p.title, url: p.links.demo!, slug: p.slug }));
  const ticker = all.map((p) => ({ slug: p.slug, title: p.title, theme: p.themes[0], playable: !!p.links.demo }));
  const games = all.filter((p) => p.themes.includes("games")).length;
  const words = ["I build", "useful tools,", "playful worlds,", "and experiments", "worth trying."];
  return (
    <>
      <section className="j-hero-wrap">
        <div className="j-aurora" aria-hidden="true"><i /><i /><i /></div>
        <HeroField />
        <div className="studio-wrap j-hero">
          <div>
            <p className="eyebrow j-pop">Maurice Garcia · workshop &amp; journal</p>
            <h1 className="display j-title">
              {words.map((w, i) => <span className="j-word" style={{ "--i": i } as React.CSSProperties} key={w}>{i === 1 ? <em>{w}</em> : w}{" "}</span>)}
            </h1>
            <p className="lede j-pop" style={{ "--i": 6 } as React.CSSProperties}>This is where I keep what I make and how it's going. Try the things, read the notes, and tell me what you think. If you'd like to build something together, or need something built, there's a way to start below.</p>
            <div className="j-actions j-pop" style={{ "--i": 7 } as React.CSSProperties}>
              <Link href="/projects" className="btn btn-fill j-shine">Explore what I'm building</Link>
              <Link href="/connect" className="btn btn-ghost">Say hello</Link>
              <Link href="/services" className="j-link j-arrow">Hire me for a project</Link>
            </div>
            <div className="j-pop" style={{ "--i": 8 } as React.CSSProperties}><SurpriseMe demos={demos} /></div>
          </div>
          <figure className="j-portrait j-pop" style={{ "--i": 4 } as React.CSSProperties}>
            <Image src={site.photo} alt="Portrait of Maurice Garcia outdoors" width={600} height={750} sizes="(max-width:760px) 80vw, 30vw" priority />
            <figcaption>Hi, I'm Maurice. Most people call me Moe.</figcaption>
          </figure>
        </div>
      </section>

      <Ticker items={ticker} />

      <section className="studio-wrap j-stats" aria-label="At a glance">
        <Reveal><div><b><CountUp to={all.length} /></b><span>projects on the shelf</span></div></Reveal>
        <Reveal delay={80}><div><b><CountUp to={withDemo.length} /></b><span>you can try in your browser right now</span></div></Reveal>
        <Reveal delay={160}><div><b><CountUp to={games} /></b><span>games and worlds</span></div></Reveal>
      </section>

      {now && (
        <Reveal><section className="j-focus" aria-labelledby="focus-h">
          <div className="studio-wrap">
            <p className="eyebrow" id="focus-h">Current focus</p>
            <blockquote style={{ marginTop: 14 }}>{now.focus}</blockquote>
            <p className="j-meta">
              {now.reviewedBy === "owner" ? <span>Last reviewed {formatDate(now.reviewedAt)}</span> : <span>Not yet reviewed by me</span>}
              {isProposed(now) && <Proposed />}
              <Link className="j-link" href="/now">More on the Now page</Link>
            </p>
          </div>
        </section></Reveal>
      )}

      <section className="studio-wrap j-section" id="projects" aria-labelledby="projects-h">
        <Reveal><div className="j-head">
          <div><p className="eyebrow">Selected projects</p><h2 className="display" id="projects-h">Things you can try, read about, or help with</h2></div>
          <Link href="/projects" className="j-link j-arrow">All {all.length} projects</Link>
        </div></Reveal>
        {lead && <Reveal><ProjectLead project={lead} /></Reveal>}
        {rest.length > 0 && <ul className="j-rows">{rest.map((p, i) => <Reveal as="li" key={p.id} delay={i * 70} className="j-row-wrap"><ProjectRow project={p} bare /></Reveal>)}</ul>}
        <Reveal><p style={{ marginTop: 34 }}><Link href="/projects" className="btn btn-ghost j-shine">Browse all {all.length}, filter by what you like</Link></p></Reveal>
      </section>

      {updates.length > 0 && (
        <section className="studio-wrap j-section" aria-labelledby="updates-h">
          <Reveal><div className="j-head">
            <div><p className="eyebrow">Latest updates</p><h2 className="display" id="updates-h">What changed lately</h2></div>
            <Link href="/updates" className="j-link j-arrow">All updates</Link>
          </div></Reveal>
          <ul className="j-updates">{updates.map((u, i) => { const p = projectById(u.projectId); return <Reveal as="li" key={u.id} delay={i * 80} className="j-update-wrap"><UpdateItem update={u} projectTitle={p?.title} projectSlug={p?.slug} bare /></Reveal>; })}</ul>
        </section>
      )}

      {posts.length > 0 && (
        <section className="studio-wrap j-section" aria-labelledby="writing-h">
          <Reveal><div className="j-head">
            <div><p className="eyebrow">Recent writing</p><h2 className="display" id="writing-h">Longer thoughts</h2></div>
            <Link href="/writing" className="j-link j-arrow">All writing</Link>
          </div></Reveal>
          <ul className="j-updates">{posts.map((p) => (
            <Reveal as="li" key={p.id} className="j-update-wrap"><div className="j-update"><time dateTime={p.publishedAt}>{p.publishedAt ? formatDate(p.publishedAt) : ""}</time>
              <div><h3 className="display"><Link href={`/writing/${p.slug}`}>{p.title}</Link></h3><p>{p.description}</p>{isProposed(p) && <p style={{ marginTop: 8 }}><Proposed /></p>}</div></div></Reveal>
          ))}</ul>
        </section>
      )}

      <section className="studio-wrap j-section" aria-labelledby="connect-h">
        <Reveal><div className="j-head"><div><p className="eyebrow">Connect</p><h2 className="display" id="connect-h">Start something worthwhile</h2></div></div></Reveal>
        <div className="j-split">
          <Reveal><div className="j-panel">
            <h3 className="display">Say hello, or make something together</h3>
            <p>Played a demo and found a bug? Have an odd idea you want a collaborator for? Write to me. No agenda needed, and no budget either.</p>
            <div className="actions"><Link className="btn btn-fill j-shine" href="/connect">Say hello</Link><a className="j-link" href={`mailto:${site.email}`}>{site.email}</a></div>
          </div></Reveal>
          <Reveal delay={100}><div className="j-panel">
            <h3 className="display">Need something built, or want to learn?</h3>
            <p>I build websites and custom software for small businesses, run AI-receptionist pilots, and coach people one-to-one on building with AI tools. Scope and price are agreed before any work starts.</p>
            <div className="actions"><Link className="btn btn-ghost" href="/services">See how I work</Link><Link className="j-link" href="/connect?intent=paid-work">Ask about paid work</Link><Link className="j-link j-arrow" href="/lab">Browse the design lab</Link></div>
          </div></Reveal>
        </div>
      </section>
    </>
  );
}
