import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { capabilities } from "@/lib/capabilities";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Work with me",
  description: "Custom development and consulting, product partnerships and licensing, and education, for companies and founders with ambitious ideas. Every engagement is a custom quote.",
};

const ways = [
  { id: "build", status: "Available now", title: "Custom development and consulting", body: "You bring an ambitious idea, a system that needs custom software, automation or an AI integration, or an experience that doesn't exist yet. I turn it into something working, in increments you can see, and I quote it to the outcome.", cta: "Start a build", href: "/connect?intent=paid-work", primary: true },
  { id: "partner", status: "Open to conversations", title: "Licensing, partnerships and backing", body: "I'm building products of my own. Pipeline CRM, Ultimate and Lumen are open to licensing conversations, and ThriftScout is open to partnerships. If one fits your company, your portfolio or your market, let's talk.", cta: "Talk partnership", href: "/connect?intent=partner" },
  { id: "products", status: "In development", title: "Products and subscriptions", body: "My long-term focus is building products that scale, not selling hours. Subscription products aren't live yet. ThriftScout is a live pilot with no payments, and I'd like to hear from people who would use or back what I'm building.", cta: "Follow what I'm building", href: "/projects?track=products" },
  { id: "learn", status: "Free and paid", title: "Education", body: "Free lessons on building useful things with AI, using whichever tools fit, and live one-to-one sessions if you'd rather move faster. Suitable for people with very little programming experience.", cta: "Start learning", href: "/learn" },
  { id: "hire", status: "Open", title: "Hire me", body: "Recruiters and technology teams looking for creative engineering talent: I build across AI, software, interactive experiences, games and mobile, and I ship. Tell me about the role.", cta: "Tell me about the role", href: "/connect?intent=hire" },
];

export default function ServicesPage() {
  const specific = services.filter((s) => s.kind === "software");
  return (
    <div className="studio-wrap" style={{ paddingBottom: 90 }}>
      <header className="j-page-head">
        <p className="eyebrow">Work with me</p>
        <h1 className="display">Bring me the ambitious version of your idea</h1>
        <p className="lede">I&apos;m an Experience Engineer and independent builder. I work with companies and founders who want something that doesn&apos;t exist yet to be working, not just planned. I sell outcomes, capability and execution, so every engagement is a <strong>custom quote</strong>, agreed before work starts.</p>
        <p className="j-actions"><Link className="btn btn-fill j-shine" href="/connect?intent=paid-work">Start a conversation</Link><Link className="j-link j-arrow" href="/projects">See the work first</Link></p>
      </header>

      <section className="j-section" style={{ paddingTop: 24 }} aria-labelledby="ways-h">
        <Reveal><div className="j-head"><div><p className="eyebrow">Five ways to work together</p><h2 className="display" id="ways-h">Not everything is a services engagement</h2></div></div></Reveal>
        <div className="j-ways">
          {ways.map((w, i) => (
            <Reveal key={w.id} delay={i * 60}><div className="j-panel" id={w.id}><p className="j-tag">{w.status}</p><h3 className="display">{w.title}</h3><p>{w.body}</p><div className="actions"><Link className={w.primary ? "btn btn-fill j-shine" : "btn btn-ghost"} href={w.href}>{w.cta}</Link></div></div></Reveal>
          ))}
        </div>
      </section>

      <section className="j-section" aria-labelledby="cap-h">
        <Reveal><div className="j-head"><div><p className="eyebrow">What I build</p><h2 className="display" id="cap-h">Capabilities, each with proof you can open</h2></div></div></Reveal>
        <ul className="j-caps">{capabilities.map((c, i) => <Reveal as="li" key={c.id} delay={i * 50} className="j-cap-wrap"><div className="j-cap"><h3 className="display">{c.title}</h3><p>{c.line}</p></div></Reveal>)}</ul>
      </section>

      <section className="j-section" aria-labelledby="how-h">
        <Reveal><div className="j-head"><div><p className="eyebrow">How an engagement works</p><h2 className="display" id="how-h">A conversation, then working software</h2></div></div></Reveal>
        <div className="j-ways">{[
          ["01 · Understand", "We talk through the outcome you need and what would make it a success. If I'm the wrong fit I'll say so."],
          ["02 · Scope and quote", "I propose what to build first, how we'll know it works, and a custom quote. Nothing starts until we agree."],
          ["03 · Build in the open", "You see working increments, not a reveal at the end."],
        ].map(([t, p], i) => <Reveal key={t} delay={i * 60}><div className="j-panel"><h3 className="display">{t}</h3><p>{p}</p></div></Reveal>)}</div>
      </section>

      <section className="j-section" aria-labelledby="start-h">
        <Reveal><div className="j-head"><div><p className="eyebrow">Starting points</p><h2 className="display" id="start-h">Specific engagements I can scope quickly</h2></div></div></Reveal>
        <p className="j-muted" style={{ marginBottom: 22, maxWidth: "46em" }}>If your need already looks like one of these, you can start from it. All are custom quotes, and each can grow into something larger.</p>
        <div className="j-caps">{specific.map((s, i) => (
          <Reveal key={s.slug} delay={i * 40}><article className="j-cap" style={{ height: "100%" }}>
            <p className="j-tag">Custom quote</p><h3 className="display">{s.name}</h3><p>{s.summary}</p>
            <ul style={{ listStyle: "disc", paddingLeft: "1.2em", color: "var(--j-muted)", lineHeight: 1.6, fontSize: ".92rem" }}>{s.details.slice(0, 3).map((d) => <li key={d}>{d}</li>)}</ul>
            <p className="j-cap-proof"><Link className="j-link j-arrow" href={`/connect?service=${s.slug}`}>Request this</Link></p>
          </article></Reveal>
        ))}</div>
        <p className="j-muted" style={{ marginTop: 26 }}>Also: <Link className="j-link" href="/coaching">one-to-one AI coaching</Link>, <Link className="j-link" href="/ai-receptionist">AI receptionist pilots</Link>, and <Link className="j-link" href="/shop">guides in the shop</Link>.</p>
      </section>
    </div>
  );
}
