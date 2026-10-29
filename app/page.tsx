import Image from "next/image";
import Link from "next/link";
import { ProjectLead, ProjectRow, Proposed, UpdateItem } from "@/components/ProjectParts";
import { SurpriseMe } from "@/components/SurpriseMe";
import { featuredProjects, formatDate, listedPosts, listedUpdates, projectById, shownNow } from "@/lib/content/query";
import { isProposed } from "@/lib/content/visibility";
import { site } from "@/lib/site";

export default function HomePage() {
  const featured = featuredProjects();
  const lead = featured.find((p) => p.media[0]) ?? featured[0];
  const rest = featured.filter((p) => p !== lead);
  const now = shownNow();
  const updates = listedUpdates().slice(0, 3);
  const posts = listedPosts().slice(0, 2);
  const demos = featured.filter((p) => p.links.demo).map((p) => ({ title: p.title, url: p.links.demo!, slug: p.slug }));
  return (
    <>
      <section className="studio-wrap j-hero">
        <div>
          <p className="eyebrow">Maurice Garcia · workshop &amp; journal</p>
          <h1 className="display">I build <em>useful tools</em>, playful worlds, and experiments worth trying.</h1>
          <p className="lede">This is where I keep what I make and how it's going. Try the things, read the notes, and tell me what you think. If you'd like to build something together, or need something built, there's a way to start below.</p>
          <div className="j-actions">
            <Link href="/projects" className="btn btn-fill">Explore what I'm building</Link>
            <Link href="/connect" className="btn btn-ghost">Say hello</Link>
            <Link href="/services" className="j-link j-arrow">Hire me for a project</Link>
          </div>
          <SurpriseMe demos={demos} />
        </div>
        <figure className="j-portrait">
          <Image src={site.photo} alt="Portrait of Maurice Garcia outdoors" width={600} height={750} sizes="(max-width:760px) 80vw, 30vw" priority />
          <figcaption>Hi, I'm Maurice. Most people call me Moe.</figcaption>
        </figure>
      </section>

      {now && (
        <section className="j-focus" aria-labelledby="focus-h">
          <div className="studio-wrap">
            <p className="eyebrow" id="focus-h">Current focus</p>
            <blockquote style={{ marginTop: 14 }}>{now.focus}</blockquote>
            <p className="j-meta">
              {now.reviewedBy === "owner" ? <span>Last reviewed {formatDate(now.reviewedAt)}</span> : <span>Not yet reviewed by me</span>}
              {isProposed(now) && <Proposed />}
              <Link className="j-link" href="/now">More on the Now page</Link>
            </p>
          </div>
        </section>
      )}

      <section className="studio-wrap j-section" id="projects" aria-labelledby="projects-h">
        <div className="j-head">
          <div><p className="eyebrow">Selected projects</p><h2 className="display" id="projects-h">Things you can try, read about, or help with</h2></div>
          <Link href="/projects" className="j-link j-arrow">All projects and the archive</Link>
        </div>
        {lead && <ProjectLead project={lead} />}
        {rest.length > 0 && <ul className="j-rows">{rest.map((p) => <ProjectRow key={p.id} project={p} />)}</ul>}
      </section>

      {updates.length > 0 && (
        <section className="studio-wrap j-section" aria-labelledby="updates-h">
          <div className="j-head">
            <div><p className="eyebrow">Latest updates</p><h2 className="display" id="updates-h">What changed lately</h2></div>
            <Link href="/updates" className="j-link j-arrow">All updates</Link>
          </div>
          <ul className="j-updates">{updates.map((u) => { const p = projectById(u.projectId); return <UpdateItem key={u.id} update={u} projectTitle={p?.title} projectSlug={p?.slug} />; })}</ul>
        </section>
      )}

      {posts.length > 0 && (
        <section className="studio-wrap j-section" aria-labelledby="writing-h">
          <div className="j-head">
            <div><p className="eyebrow">Recent writing</p><h2 className="display" id="writing-h">Longer thoughts</h2></div>
            <Link href="/writing" className="j-link j-arrow">All writing</Link>
          </div>
          <ul className="j-updates">{posts.map((p) => (
            <li className="j-update" key={p.id}><time dateTime={p.publishedAt}>{p.publishedAt ? formatDate(p.publishedAt) : ""}</time>
              <div><h3 className="display"><Link href={`/writing/${p.slug}`}>{p.title}</Link></h3><p>{p.description}</p>{isProposed(p) && <p style={{ marginTop: 8 }}><Proposed /></p>}</div></li>
          ))}</ul>
        </section>
      )}

      <section className="studio-wrap j-section" aria-labelledby="connect-h">
        <div className="j-head"><div><p className="eyebrow">Connect</p><h2 className="display" id="connect-h">Start something worthwhile</h2></div></div>
        <div className="j-split">
          <div className="j-panel">
            <h3 className="display">Say hello, or make something together</h3>
            <p>Played a demo and found a bug? Have an odd idea you want a collaborator for? Write to me. No agenda needed, and no budget either.</p>
            <div className="actions"><Link className="btn btn-fill" href="/connect">Say hello</Link><a className="j-link" href={`mailto:${site.email}`}>{site.email}</a></div>
          </div>
          <div className="j-panel">
            <h3 className="display">Need something built, or want to learn?</h3>
            <p>I build websites and custom software for small businesses, run AI-receptionist pilots, and coach people one-to-one on building with AI tools. Scope and price are agreed before any work starts.</p>
            <div className="actions"><Link className="btn btn-ghost" href="/services">See how I work</Link><Link className="j-link" href="/connect?intent=paid-work">Ask about paid work</Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
