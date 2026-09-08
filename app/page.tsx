import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";
import { services } from "@/lib/services";

export default function HomePage() {
  return <>
    <section className="studio-hero">
      <Image src="/images/studio-sculpture.webp" alt="" fill priority sizes="100vw" className="hero-art" />
      <div className="hero-shade" />
      <div className="studio-wrap hero-content">
        <p className="eyebrow"><span className="status-dot"/> Independent design & development · California</p>
        <h1 className="display">Make your<br/>next move<br/><em>impossible<br className="mobile-break"/> to ignore.</em></h1>
        <p className="hero-intro">Distinctive websites. Useful software.<br/>Built around your business, by Maurice Garcia.</p>
        <div className="hero-actions"><Link href="/contact" className="btn btn-fill">Start your project <span>↗</span></Link><Link href="#work" className="text-link">Explore the work ↓</Link></div>
      </div>
      <div className="hero-bottom studio-wrap"><span>Strategy → Design → Development → Launch</span><span>01 / A better presence</span></div>
    </section>
    <div className="capability-strip"><span>Business websites</span><b>✳</b><span>Online stores</span><b>✳</b><span>Custom applications</span><b>✳</b><span>Ongoing care</span></div>
    <section id="services" className="studio-wrap studio-section">
      <div className="section-heading"><p className="eyebrow">01 / What I can do for you</p><h2 className="display">A big idea.<br/>A practical way forward.</h2><p>A new business, an overdue refresh, or a tool you wish existed. Let’s turn it into something people can use.</p></div>
      <div className="offer-grid">{services.slice(0,3).map((s,i) => <Link href={`/contact?service=${s.slug}`} key={s.slug} className="offer-card"><div className="offer-top"><span>0{i+1}</span><span className="offer-arrow">↗</span></div><h3 className="display">{s.name}</h3><p>{s.summary}</p><div className="offer-tags">{s.details.slice(0,2).map(d=><span key={d}>{d}</span>)}</div><div className="offer-price">{s.price}<span>Let’s talk</span></div></Link>)}</div>
      <Link href="/services" className="text-link mt-8 inline-block">Explore all services, including custom software ↗</Link>
    </section>
    <section className="studio-wrap studio-section"><div className="section-heading"><p className="eyebrow">New / AI receptionist pilots</p><h2 className="display">Busy on the job?<br/>Your callers still matter.</h2><p>Explore an after-hours receptionist that captures inquiries and follows your handoff rules. Start with a free review of your call flow.</p></div><Link href="/ai-receptionist" className="btn btn-fill">Explore AI receptionists ↗</Link></section>
    <section id="work" className="work-section"><div className="studio-wrap studio-section"><div className="section-heading"><p className="eyebrow">02 / Selected work</p><h2 className="display">Built for the way<br/>real businesses work.</h2></div><div className="featured-work"><div className="pipeline-visual" aria-label="Diagram of the Pipeline CRM workflow"><div className="pipeline-brand"><span className="pipeline-symbol">P/</span><span>PIPELINE<br/><small>BUSINESS OPERATIONS</small></span></div><p className="pipeline-caption">From first call to final payment.</p><div className="workflow-chain"><span>Lead</span><b>→</b><span>Estimate</span><b>→</b><span>Job</span><b>→</b><span>Paid</span></div><p className="diagram-label">Workflow illustration · Pipeline CRM</p></div><div className="work-copy"><p className="eyebrow">Custom application / Construction</p><h3 className="display">Pipeline CRM</h3><p>One place for leads, estimates, invoices, deposits, and jobs. Built for Don Howard Construction / Painting to connect the office and the crew.</p><div className="work-tags"><span>Business workflows</span><span>Mobile web app</span><span>Payments</span></div><Link href="/work" className="btn btn-ghost">See the project ↗</Link></div></div></div></section>
    <section className="studio-wrap studio-section personal-section"><div className="personal-photo"><Image src={site.photo} alt="Maurice Garcia" width={600} height={750} sizes="(max-width: 760px) 100vw, 35vw"/><span>Independent. Hands-on. Maurice.</span></div><div><p className="eyebrow">03 / Your collaborator</p><h2 className="display">You bring the vision.<br/>I build the thing.</h2><p className="body-large">You work directly with the person designing and building your website. We agree on the scope, review the work together, and launch something that belongs to your business.</p><Link href="/about" className="text-link">A little more about me ↗</Link><div className="process-list">{[["01","Get clear","Tell me about your business and what needs to happen next."],["02","Make it real","Agree on scope and price, then review the design and build."],["03","Put it to work","Launch with a handoff and optional ongoing website care."]].map(([n,t,d])=><div key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div></div>)}</div></div></section>
    <section className="studio-wrap faq-section"><div><p className="eyebrow">Before we start</p><h2 className="display">A few good questions.</h2></div><div>{[["What if I only have an idea?","That is enough to start. Tell me who your website is for and what you want it to help them do. We can work out the pages and features together."],["How much does a website cost?","Website builds and redesigns are quoted to scope. Share your budget and goals, and I will propose a plan before any work or payment is agreed."],["Can you improve my existing website?","Yes. Send the link and explain what is getting in the way. We can discuss a focused improvement or a complete redesign."],["Can you help after launch?","Yes. Ask about a monthly website care plan for content updates, maintenance, and agreed improvements."]].map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
    <section className="closing-cta"><div className="studio-wrap"><p className="eyebrow">Your next move</p><h2 className="display">Let’s build<br/><em>something that matters.</em></h2><Link href="/contact" className="btn btn-fill">Tell me what you have in mind ↗</Link><a href="mailto:hello@mauricegarcia.com" className="closing-email">hello@mauricegarcia.com</a></div></section>
  </>;
}

