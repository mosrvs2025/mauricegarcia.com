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
import { MATURITY_LABELS, TRACK_LABELS, featuredByTrack, formatDate, listedPosts, listedProjects, listedUpdates, projectById, projectBySlug, projectsByTrack, shownNow } from "@/lib/content/query";
import { isProposed } from "@/lib/content/visibility";
import { CaseAnnotation } from "@/components/CaseAnnotation";
import { HomeShowcase } from "@/components/HomeShowcase";
import { PlaygroundTrigger } from "@/components/PlaygroundTrigger";
import { ProjectSpotlight } from "@/components/ProjectSpotlight";
import Image from "next/image";
import { InstagramPortrait } from "@/components/InstagramPortrait";
import { SecretShelf, SecretShelfTrigger } from "@/components/SecretShelf";

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
  const spotlight = projectBySlug("ultimate");
  const hub = projectBySlug("realmbreak");
  const showcase = ["ultron", "realmbreak", "ultimate"].flatMap((slug) => { const p = all.find((p) => p.slug === slug); return p ? [toCard(p)] : []; });
  return (
    <div className="home-page">
      <section className="j-hero-wrap home-opening" aria-labelledby="home-title">
        <div className="j-aurora" aria-hidden="true"><i /><i /><i /></div>
        <HeroField />
        <div className="studio-wrap j-hero home-hero">
          <div className="hero-meta">
            <div className="home-byline">
              <InstagramPortrait size="hero" />
              <div>
                <p className="eyebrow">Maurice Garcia / Experience Engineer</p>
                <a className="home-ig-handle" href={site.instagram} target="_blank" rel="noopener noreferrer">@{site.instagramHandle}</a>
                <SecretShelfTrigger />
              </div>
            </div>
            <div className="hero-note">
              <CaseAnnotation n={1} kind="experiment" label="What “break” means here" source="the Playground's own entry card and docs" align="start">
                Breaking is experimenting. The Playground is an opt-in mode that blasts this page with canvas debris and then repairs it. The page itself is never modified, and nothing connects to anyone until you choose to enter.
              </CaseAnnotation>
            </div>
            {/* One line per identity; CSS shows the one that matches the active skin (see app/identities.css). */}
            <p className="hero-tag">
              <span className="hv hv-case">Build / Test / Play</span>
              <span className="hv hv-rogue">Build / Test / Play · Mode: experiment</span>
              <span className="hv hv-manual">Unauthorized user manual · Rev. 001</span>
            </p>
          </div>
          <h1 id="home-title" className="display j-title home-title">
            <span className="hv hv-case">I build things.<br /><em>Then I break them.</em></span>
            <span className="hv hv-rogue">Systems should<br /><em>do more.</em></span>
            <span className="hv hv-manual">Do not build<br /><em>normal.</em></span>
          </h1>
          <div className="hero-copy">
            <p className="lede">I&apos;m Maurice Garcia, an experience engineer. After a decade in fraud prevention, I now build practical software, strange digital worlds, and experiments you can actually try.</p>
            <div className="j-actions">
              <Link href="#case-files" className="btn btn-fill j-shine">Explore the work <span aria-hidden="true">↘</span></Link>
              <Link href="/connect?intent=paid-work" className="j-link j-arrow">Let&apos;s build something</Link>
            </div>
            <div className="home-curiosity" data-float-clear><SurpriseMe demos={demos} /><Link href="/v/game" className="j-link" data-track="game_version">Play this site as a game</Link><SecretShelf /></div>
          </div>
          <HomeShowcase projects={showcase} />
          <ol className="hero-verbs" aria-label="How to use this site">
            <li><a href="#case-files"><b>01</b> Try it<span>Open a live demo</span></a></li>
            <li><PlaygroundTrigger><b>02</b> Break it<span>Open the Playground</span></PlaygroundTrigger></li>
            <li><Link href="/projects/ultimate"><b>03</b> Understand it<span>Read a case study</span></Link></li>
          </ol>
        </div>
      </section>

      <Ticker items={ticker} />

      <section id="case-files" className="studio-wrap j-section cases-head" aria-labelledby="cases-h">
        <Reveal><div className="j-head">
          <div><p className="eyebrow">Case files</p><h2 className="display" id="cases-h">Two projects, shown honestly.</h2></div>
          <Link href="/projects" className="j-link j-arrow">All {all.length} projects</Link>
        </div></Reveal>
        <p className="cases-intro">Each file shows what the project is, how finished it really is, and what it can&apos;t do yet. Tap a numbered note to read one real engineering decision or limitation.</p>
      </section>

      {spotlight && (
        <ProjectSpotlight
          project={spotlight}
          number="01"
          eyebrow="Newest build"
          headline="Ultimate+: the toolkit for your own phone"
          inside={["Video editor and shrinker", "Storage map", "Notification and clipboard history", "Rules automation", "Terminal", "SSH client and server", "Footprint privacy insights", "Focus companion", "Air control", "Galaxy Watch app", "Local AI"]}
          privacyNote="No ads, no analytics, no accounts. The offline edition has no internet permission. Screens are rendered on a simulated phone with sample data."
          notes={<>
            <CaseAnnotation n={2} kind="decision" label="One interface, many tools" source="Ultimate+ case study (repository README and docs)">
              Every tool implements one small interface: an id, a screen, a library of what it made, and how to remove one. Home, the Library, the Activity tab and share routing pick up a new tool with no other changes.
            </CaseAnnotation>
            <CaseAnnotation n={3} kind="decision" label="An offline edition" source="repository README, via the project page">
              The offline edition, Ultimate, has no internet permission, so it cannot send anything anywhere. Ultimate+ does use the internet permission, for SSH, sending files and network tools.
            </CaseAnnotation>
            <CaseAnnotation n={4} kind="limitation" label="Screens are simulated" source="project page, limitations">
              The screenshots are the app&apos;s own screens rendered on a simulated phone with sample data, not photos of a real device.
            </CaseAnnotation>
          </>}
        />
      )}

      {hub && (
        <section className="studio-wrap j-section cf cf-spread cf-hub" aria-labelledby="hub-h">
          <Reveal><div className="cf-hub-grid">
            <figure className="cf-media" data-measure={hub.media[0] ? `${hub.media[0].width} × ${hub.media[0].height}` : undefined}>
              {hub.media[0] && <Image src={hub.media[0].src} alt={hub.media[0].alt} width={hub.media[0].width ?? 1280} height={hub.media[0].height ?? 720} sizes="(max-width:900px) 100vw, 58vw" loading="lazy" />}
              {hub.media[0]?.caption && <figcaption className="cf-cap">{hub.media[0].caption}</figcaption>}
            </figure>
            <div className="cf-copy">
              <p className="eyebrow"><span className="cf-no">File 02</span>Also live · {TRACK_LABELS[hub.track].title}</p>
              <h2 className="display" id="hub-h">REALMBREAK, in a mixed-reality hub.</h2>
              <p className="lede">{hub.tagline}</p>
              <p className="us-note"><span className="j-tag state">{MATURITY_LABELS[hub.maturity]}</span> It has its own page at mr.mauricegarcia.com, with a desktop and phone fallback. It has not yet been tested on a physical headset.</p>
              <div className="cf-notes" role="group" aria-label="Notes on REALMBREAK">
                <CaseAnnotation n={5} kind="limitation" label="Not yet tested on a headset" source="the REALMBREAK README, via the project page">
                  The README says it has not yet been tested on a physical headset. Hand-gesture and plane-detection behaviour is covered only by unit tests, and the automated XR smoke test is not part of CI.
                </CaseAnnotation>
                <CaseAnnotation n={6} kind="decision" label="It can't soft-lock" source="the REALMBREAK README, via the project page">
                  Hand tracking, controllers and mouse or touch are all supported, with an auto-fire assist and a gaze-dwell Replay, so the game does not get stuck waiting for an input you cannot give.
                </CaseAnnotation>
                <CaseAnnotation n={7} kind="decision" label="No backend" source="the REALMBREAK README, via the project page">
                  Vite, TypeScript and Three.js, with no backend. The README says every character, model, texture and sound is generated at runtime.
                </CaseAnnotation>
              </div>
              <div className="j-actions">
                <a href={site.hubUrl} className="btn btn-fill j-shine" rel="noopener noreferrer" data-verb="Try it">Open the hub <span aria-hidden="true">↗</span></a>
                <a href={`${site.hubUrl}/realmbreak`} className="j-link j-arrow" rel="noopener noreferrer" data-verb="Try it">Play REALMBREAK</a>
                <Link href="/projects/realmbreak" className="j-link" data-verb="Understand it">The project page</Link>
              </div>
            </div>
          </div></Reveal>
        </section>
      )}

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
        const shown = new Set([...showcase.map((c) => c.slug), ...(spotlight ? [spotlight.slug] : [])]);
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
    </div>
  );
}
