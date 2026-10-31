import Link from "next/link";
import dynamic from "next/dynamic";
import { Proposed, UpdateItem } from "@/components/ProjectParts";
import { Reveal } from "@/components/Reveal";
import { SurpriseMe } from "@/components/SurpriseMe";
import { Ticker } from "@/components/Ticker";
import { WorldDoors } from "@/components/WorldDoors";
import { CountUp } from "@/components/CountUp";
import { career, confirmedStats } from "@/lib/profile";
import { site } from "@/lib/site";
import { capabilities } from "@/lib/capabilities";
import { toCard } from "@/lib/content/cards";
import { featuredByTrack, formatDate, listedPosts, listedProjects, listedUpdates, projectById, projectBySlug, projectsByTrack, shownNow } from "@/lib/content/query";
import { isProposed } from "@/lib/content/visibility";
import { HomeShowcase } from "@/components/HomeShowcase";
import { SecretShelf } from "@/components/SecretShelf";

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
  const showcase = ["thornwild", "thriftscout", "lumen"].flatMap((slug) => { const p = all.find((p) => p.slug === slug); return p ? [toCard(p)] : []; });
  return (
    <>
      <section className="j-hero-wrap home-opening">
        <div className="j-aurora" aria-hidden="true"><i /><i /><i /></div>
        <HeroField />
        <div className="studio-wrap j-hero home-hero">
          <div>
            <p className="eyebrow">Maurice Garcia / Experience Engineer</p>
            <h1 className="display j-title home-title">Useful products.<br /><em>Unexpected worlds.</em></h1>
            <p className="lede">I build software, AI tools and interactive experiences. From a better way to run a business to a world worth getting lost in.</p>
            <div className="j-actions">
              <Link href="#worlds-h" className="btn btn-fill j-shine">Explore the work <span aria-hidden="true">↘</span></Link>
              <Link href="/connect?intent=paid-work" className="j-link j-arrow">Let&apos;s build something</Link>
            </div>
            <div className="home-curiosity"><SurpriseMe demos={demos} /><Link href="/v/game" className="j-link" data-track="game_version">Play this site as a game</Link><SecretShelf /></div>
          </div>
          <HomeShowcase projects={showcase} />
        </div>
      </section>

      <Ticker items={ticker} />

      <section className="studio-wrap j-section tr" aria-labelledby="tr-h">
        <Reveal><div className="tr-grid">
          <div>
            <p className="eyebrow">Track record</p>
            <h2 className="display" id="tr-h">{career.headline}</h2>
            {career.story.map((line) => <p key={line} className="tr-story">{line}</p>)}
          </div>
          <dl className="tr-stats">
            {[...confirmedStats().map((s) => ({ value: s.value, label: s.label })),
              { value: String(all.length), label: "projects built and shipped here" },
              { value: String(withDemo.length), label: "live demos you can open today" },
            ].map((s) => {
              const n = parseInt(s.value, 10); const suffix = s.value.replace(/^\d+/, "");
              return <div key={s.label}><dt>{Number.isFinite(n) ? <><CountUp to={n} />{suffix}</> : s.value}</dt><dd>{s.label}</dd></div>;
            })}
          </dl>
        </div></Reveal>
      </section>

      <WorldDoors worlds={(["experiences", "products", "labs"] as const).map((track) => {
        const shown = new Set(showcase.map((c) => c.slug));
        const rest = [...featuredByTrack(track), ...projectsByTrack(track).filter((p) => p.tier !== "featured")].filter((p) => !shown.has(p.slug));
        return { track, lead: { experiences: "Games and worlds built to be played.", products: "Software built around real problems.", labs: "Experiments that follow an interesting question." }[track], total: projectsByTrack(track).length, projects: rest.map(toCard) };
      })} />

      <section className="studio-wrap qc-band" aria-labelledby="talk-h">
        <Reveal><div className="qc-band-inner">
          <div><p className="eyebrow">Have something in mind?</p><h2 className="display" id="talk-h">Let&apos;s make it real.</h2></div>
          <div className="qc-band-actions">
            <Link href="/connect?intent=paid-work" className="btn btn-fill j-shine">Start a project</Link>
            <a href={`mailto:${site.email}`} className="j-link j-arrow">{site.email}</a>
          </div>
        </div></Reveal>
      </section>

      <section className="studio-wrap j-section" aria-labelledby="cap-h">
        <Reveal><div className="j-head"><div><p className="eyebrow">Behind the work</p><h2 className="display" id="cap-h">Creative range. Practical execution.</h2></div></div></Reveal>
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
