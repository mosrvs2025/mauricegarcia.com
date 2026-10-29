import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { LabData, LabProject } from "@/lib/lab/data";
import type { SkinId } from "@/lib/lab/skins";
import { PointerGlow } from "./PointerGlow";

const Pic = ({ p, sizes = "(max-width:760px) 100vw, 40vw" }: { p: LabProject; sizes?: string }) =>
  p.image ? <Image src={p.image.src} alt={p.image.alt} width={800} height={500} sizes={sizes} loading="lazy" /> : <span className="sk-letter" aria-hidden="true">{p.title.slice(0, 1)}</span>;

const CTA = () => <><Link className="sk-btn" href="/connect">Say hello</Link><Link className="sk-btn alt" href="/projects">All projects</Link></>;

/* ---------------------------------------------------------------- Paper & Ink */
function Paper({ d }: { d: LabData }) {
  const [lead, ...rest] = d.projects;
  return (
    <div className="sk-paper">
      <header className="pp-mast"><span>Vol. 1</span><h2 className="display">The Workshop Journal</h2><span>{d.today}</span></header>
      <section className="pp-hero">
        <div><p className="pp-kicker">Maurice Garcia</p>
          <h1 className="display">{d.headline.join(" ")}</h1>
          <p className="pp-lede">{d.intro}</p><p className="pp-cta"><CTA /></p></div>
        <aside className="pp-aside"><p className="pp-kicker">By the numbers</p>
          <dl><div><dt>{d.stats.all}</dt><dd>projects on the shelf</dd></div><div><dt>{d.stats.playable}</dt><dd>playable in a browser</dd></div><div><dt>{d.stats.games}</dt><dd>games and worlds</dd></div></dl></aside>
      </section>
      <section className="pp-lead">
        <Link href={`/projects/${lead.slug}`} className="pp-lead-link"><div className="pp-fig"><Pic p={lead} sizes="(max-width:760px) 100vw, 55vw" /></div>
          <div><p className="pp-kicker">Featured · {lead.stateLabel}</p><h3 className="display">{lead.title}</h3><p>{lead.tagline}</p><span className="pp-more">Read the project →</span></div></Link>
      </section>
      <section className="pp-contents"><h3 className="pp-kicker">Contents</h3>
        <ol>{[lead, ...rest].map((p, i) => <li key={p.slug}><Link href={`/projects/${p.slug}`}><span className="n">{String(i + 1).padStart(2, "0")}</span><span className="t display">{p.title}</span><span className="dots" aria-hidden="true" /><span className="s">{p.stateLabel}</span></Link></li>)}</ol></section>
      <section className="pp-dispatch"><h3 className="pp-kicker">Dispatches</h3>
        <div>{d.updates.map((u) => <article key={u.slug}><time>{u.date}</time><h4 className="display"><Link href={`/updates/${u.slug}`}>{u.title}</Link></h4><p>{u.summary}</p></article>)}</div></section>
    </div>
  );
}

/* ------------------------------------------------------------------- Terminal */
function Terminal({ d }: { d: LabData }) {
  return (
    <div className="sk-terminal">
      <div className="tm-win">
        <div className="tm-bar"><i /><i /><i /><span>maurice@workshop: ~</span></div>
        <div className="tm-body">
          <p className="tm-line"><b>$</b> whoami</p><p className="tm-out type" style={{ "--n": 14 } as CSSProperties}>maurice-garcia</p>
          <p className="tm-line"><b>$</b> cat intro.txt</p>
          <h1 className="tm-h1">{d.headline.join(" ")}<span className="tm-cursor" aria-hidden="true" /></h1>
          <p className="tm-out">{d.intro}</p>
          <p className="tm-line"><b>$</b> ls -l projects/ <span className="tm-dim"># {d.stats.all} total, {d.stats.playable} playable</span></p>
          <ul className="tm-ls">{d.projects.map((p) => (
            <li key={p.slug}><Link href={`/projects/${p.slug}`}><span className="perm">{p.demo ? "-rwxr-xr-x" : "-rw-r--r--"}</span><span className="stt">{p.stateLabel.toLowerCase().replace(/ /g, "-")}</span><span className="nm">{p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/</span><span className="ds">{p.tagline}</span></Link></li>))}</ul>
          <p className="tm-line"><b>$</b> tail -n 3 updates.log</p>
          <ul className="tm-log">{d.updates.map((u) => <li key={u.slug}><time>{u.date}</time> <Link href={`/updates/${u.slug}`}>{u.title}</Link></li>)}</ul>
          <p className="tm-line"><b>$</b> ./say-hello.sh <span className="tm-cursor" aria-hidden="true" /></p>
          <p className="tm-out"><CTA /></p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- Neo-Pop */
function Pop({ d }: { d: LabData }) {
  const colors = ["#ff4fa3", "#3d7bff", "#2ee59d", "#ff8a3d", "#b07cff", "#ffe14d"];
  return (
    <div className="sk-pop">
      <section className="po-hero">
        <p className="po-sticker s1">Made by Moe!</p><p className="po-sticker s2">{d.stats.playable} you can play</p>
        <h1>{d.headline.map((w, i) => <span key={w} style={{ "--c": colors[i % colors.length] } as CSSProperties}>{w} </span>)}</h1>
        <p className="po-lede">{d.intro}</p><p className="po-cta"><CTA /></p>
      </section>
      <div className="po-marquee" aria-hidden="true"><div>{[...d.projects, ...d.projects, ...d.projects].map((p, i) => <span key={i}>★ {p.title}</span>)}</div></div>
      <section className="po-grid">{d.projects.map((p, i) => (
        <Link key={p.slug} href={`/projects/${p.slug}`} className="po-card" style={{ "--c": colors[i % colors.length], "--r": `${(i % 3 - 1) * 1.4}deg` } as CSSProperties}>
          <div className="po-pic"><Pic p={p} /></div><span className="po-tag">{p.stateLabel}</span><h3>{p.title}</h3><p>{p.tagline}</p></Link>))}</section>
      <section className="po-news"><h2>Fresh stuff</h2>{d.updates.map((u) => <Link key={u.slug} href={`/updates/${u.slug}`}><time>{u.date}</time><strong>{u.title}</strong></Link>)}</section>
    </div>
  );
}

/* --------------------------------------------------------------- Glass Aurora */
function Glass({ d }: { d: LabData }) {
  return (
    <div className="sk-glass">
      <PointerGlow />
      <section className="gl-hero"><p className="gl-pill">Workshop &amp; journal</p><h1>{d.headline.join(" ")}</h1><p className="gl-lede">{d.intro}</p><p className="gl-cta"><CTA /></p>
        <div className="gl-stats"><div><b>{d.stats.all}</b><span>projects</span></div><div><b>{d.stats.playable}</b><span>playable</span></div><div><b>{d.stats.games}</b><span>games</span></div></div></section>
      <section className="gl-grid">{d.projects.map((p) => (
        <Link key={p.slug} href={`/projects/${p.slug}`} className="gl-card"><div className="gl-pic"><Pic p={p} /></div><div className="gl-body"><span className="gl-pill sm">{p.stateLabel}</span><h3>{p.title}</h3><p>{p.tagline}</p></div></Link>))}</section>
      {d.focus && <section className="gl-focus"><p className="gl-pill">Right now</p><blockquote>{d.focus}</blockquote></section>}
    </div>
  );
}

/* ------------------------------------------------------------------ Swiss Grid */
function Swiss({ d }: { d: LabData }) {
  return (
    <div className="sk-swiss">
      <div className="sw-lines" aria-hidden="true">{Array.from({ length: 12 }).map((_, i) => <i key={i} />)}</div>
      <header className="sw-top"><span>Maurice Garcia</span><span>Workshop / Journal</span><span>{d.today}</span><span>({d.stats.all}) projects</span></header>
      <section className="sw-hero"><h1>{d.headline.map((w) => <span key={w}>{w}</span>)}</h1><div className="sw-block" aria-hidden="true" /><p>{d.intro}</p><p className="sw-cta"><CTA /></p></section>
      <section className="sw-index"><h2>Index</h2>
        <ol>{d.projects.map((p, i) => <li key={p.slug}><Link href={`/projects/${p.slug}`}><span className="n">{String(i + 1).padStart(2, "0")}</span><span className="t">{p.title}</span><span className="d">{p.tagline}</span><span className="s">{p.stateLabel}</span></Link></li>)}</ol></section>
      <section className="sw-news"><h2>Updates</h2>{d.updates.map((u) => <article key={u.slug}><time>{u.date}</time><h3><Link href={`/updates/${u.slug}`}>{u.title}</Link></h3><p>{u.summary}</p></article>)}</section>
    </div>
  );
}

/* ---------------------------------------------------------------------- Arcade */
function Arcade({ d }: { d: LabData }) {
  return (
    <div className="sk-arcade">
      <div className="ar-crt" aria-hidden="true" />
      <section className="ar-hero"><p className="ar-hi">HI-SCORE <b>{String(d.stats.all * 1000).padStart(6, "0")}</b> · {d.stats.playable} PLAYABLE</p>
        <h1>{d.headline.map((w, i) => <span key={w} style={{ "--i": i } as CSSProperties}>{w}</span>)}</h1>
        <p className="ar-lede">{d.intro}</p><p className="ar-start">PRESS START</p><p className="ar-cta"><CTA /></p></section>
      <section className="ar-select"><h2>SELECT PROJECT</h2>
        <ul>{d.projects.map((p, i) => <li key={p.slug}><Link href={`/projects/${p.slug}`} className="ar-cart"><span className="ar-no">P{i + 1}</span><div className="ar-pic"><Pic p={p} sizes="30vw" /></div><span className="ar-name">{p.title}</span><span className="ar-st">{p.stateLabel}</span></Link></li>)}</ul></section>
      <section className="ar-log"><h2>NEWS</h2>{d.updates.map((u) => <Link key={u.slug} href={`/updates/${u.slug}`}><time>{u.date}</time> {u.title}</Link>)}</section>
    </div>
  );
}

export function Skin({ id, data }: { id: SkinId; data: LabData }) {
  return { paper: Paper, terminal: Terminal, pop: Pop, glass: Glass, swiss: Swiss, arcade: Arcade }[id]({ d: data });
}
