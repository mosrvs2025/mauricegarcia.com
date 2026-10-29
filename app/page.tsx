import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CountUp } from "@/components/CountUp";
import { Proposed, UpdateItem } from "@/components/ProjectParts";
import { Reveal } from "@/components/Reveal";
import { SurpriseMe } from "@/components/SurpriseMe";
import { Ticker } from "@/components/Ticker";
import { TrackSection } from "@/components/TrackSection";
import { capabilities } from "@/lib/capabilities";
import { toCard } from "@/lib/content/cards";
import { featuredByTrack, formatDate, listedPosts, listedProjects, listedUpdates, projectById, projectBySlug, projectsByTrack, shownNow } from "@/lib/content/query";
import { isProposed } from "@/lib/content/visibility";
import { site } from "@/lib/site";

// The animated grid is decorative: load it after the page is interactive so it never delays first paint.
const HeroField = dynamic(() => import("@/components/HeroField").then((m) => m.HeroField));

export default function HomePage() {
  const all = listedProjects();
  const now = shownNow();
  const updates = listedUpdates().slice(0, 3);
  const posts = listedPosts().slice(0, 2);
  const withDemo = all.filter((p) => p.links.demo);
  const demos = withDemo.map((p) => ({ title: p.title, url: p.links.demo!, slug: p.slug }));
  const ticker = all.map((p) => ({ slug: p.slug, title: p.title, theme: p.themes[0], playable: !!p.links.demo }));
  const words = ["I turn", "ambitious ideas", "into working", "products, worlds", "and experiments."];
  return (
    <>
      <section className="j-hero-wrap">
        <div className="j-aurora" aria-hidden="true"><i /><i /><i /></div>
        <HeroField />
        <div className="studio-wrap j-hero">
          <div>
            <p className="eyebrow j-pop">Experience Engineer · Creative technologist · Independent builder</p>
            <h1 className="display j-title">
              {words.map((w, i) => <span className="j-word" style={{ "--i": i } as React.CSSProperties} key={w}>{i === 1 ? <em>{w}</em> : w}{" "}</span>)}
            </h1>
            <p className="lede j-pop" style={{ "--i": 6 } as React.CSSProperties}>I&apos;m Maurice Garcia. I work across AI, software, automation, interactive experiences, games, Android and experimental technology, and I ship what I build. Try it, then tell me what you&apos;d build.</p>
            <div className="j-actions j-pop" style={{ "--i": 7 } as React.CSSProperties}>
              <Link href="#products" className="btn btn-fill j-shine">See what I&apos;ve built</Link>
              <Link href="/services" className="btn btn-ghost">Work with me</Link>
              <Link href="/connect" className="j-link j-arrow">Say hello</Link>
            </div>
            <div className="j-pop" style={{ "--i": 8 } as React.CSSProperties}><SurpriseMe demos={demos} /></div>
          </div>
          <figure className="j-portrait j-pop" style={{ "--i": 4 } as React.CSSProperties}>
            <Image src={site.photo} alt="Portrait of Maurice Garcia outdoors" width={600} height={750} sizes="(max-width:760px) 80vw, 30vw" priority />
            <figcaption>Hi, I&apos;m Maurice. Most people call me Moe.</figcaption>
          </figure>
        </div>
      </section>

      <Ticker items={ticker} />

      <section className="studio-wrap j-stats" aria-label="At a glance">
        <Reveal><div><b><CountUp to={all.length} /></b><span>projects on the shelf, each labelled production, beta, prototype or concept</span></div></Reveal>
        <Reveal delay={80}><div><b><CountUp to={withDemo.length} /></b><span>with a public demo you can open right now</span></div></Reveal>
        <Reveal delay={160}><div><b><CountUp to={3} /></b><span>tracks: products, experiences and labs</span></div></Reveal>
      </section>

      <section className="studio-wrap j-section" aria-labelledby="cap-h">
        <Reveal><div className="j-head"><div><p className="eyebrow">What I build</p><h2 className="display" id="cap-h">Six kinds of work, each with something you can open</h2></div></div></Reveal>
        <ul className="j-caps">
          {capabilities.map((c, i) => (
            <Reveal as="li" key={c.id} delay={i * 60} className="j-cap-wrap"><div className="j-cap">
              <h3 className="display">{c.title}</h3><p>{c.line}</p>
              <p className="j-cap-proof">
                {c.proof.map((slug) => projectBySlug(slug)).filter(Boolean).map((p, k) => <span key={p!.slug}>{k > 0 && " · "}<Link className="j-link" href={`/projects/${p!.slug}`}>{p!.title}</Link></span>)}
                {c.href && <Link className="j-link j-arrow" href={c.href}>Learn with me</Link>}
              </p>
            </div></Reveal>
          ))}
        </ul>
      </section>

      <TrackSection track="products" lead="Practical software built for real use and real business value" projects={featuredByTrack("products").map(toCard)} total={projectsByTrack("products").length} />
      <TrackSection track="experiences" lead="Games and worlds that run in a browser tab" projects={featuredByTrack("experiences").map(toCard)} total={projectsByTrack("experiences").length} />
      <TrackSection track="labs" lead="Experiments and tools that test what's possible" projects={featuredByTrack("labs").map(toCard)} total={projectsByTrack("labs").length} />
      <div className="studio-wrap"><Reveal><p style={{ paddingBottom: 30 }}><Link href="/projects" className="btn btn-ghost j-shine">Browse all {all.length} projects</Link></p></Reveal></div>

      <section className="studio-wrap j-section" aria-labelledby="work-h">
        <Reveal><div className="j-head"><div><p className="eyebrow">Work together</p><h2 className="display" id="work-h">Five ways to start</h2></div><Link href="/services" className="j-link j-arrow">How each one works</Link></div></Reveal>
        <div className="j-ways">
          {[
            ["Build something with me", "You have an ambitious idea, or a system that needs custom software, automation or AI. We scope it together and I quote it to the work.", "Start a build", "/connect?intent=paid-work"],
            ["License, invest or partner", "Several of my products are early. If one fits your company or your portfolio, let's talk about licensing, partnership or backing it.", "Talk partnership", "/connect?intent=partner"],
            ["Learn to build with AI", "Free tutorials and walkthroughs, and hands-on sessions if you want to move faster. Any AI tool, any experience level.", "Start learning", "/learn"],
            ["Hire me", "Recruiters and teams: I'm a creative engineer who builds across AI, software, games and mobile. Tell me about the role.", "Tell me about the role", "/connect?intent=hire"],
            ["Just say hello", "Played a demo, found a bug, or have an odd idea? Write to me. No agenda and no budget needed.", "Say hello", "/connect"],
          ].map(([t, p, cta, href], i) => (
            <Reveal key={t} delay={i * 60}><div className="j-panel"><h3 className="display">{t}</h3><p>{p}</p><div className="actions"><Link className={i === 0 ? "btn btn-fill j-shine" : "btn btn-ghost"} href={href}>{cta}</Link></div></div></Reveal>
          ))}
        </div>
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
    </>
  );
}
