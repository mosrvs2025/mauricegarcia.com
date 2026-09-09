import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI tools & coding coaching",
  description: "Practical one-to-one coaching with Maurice Garcia. Learn tools like Claude Code, work on your own project, and leave with clear next steps.",
};

export default function CoachingPage() {
  return <>
    <section className="studio-wrap studio-section">
      <p className="eyebrow">One-to-one coaching / Learn by doing</p>
      <div className="section-heading">
        <h1 className="display text-5xl leading-tight sm:text-7xl">Your idea.<br/><em>Your hands on the tools.</em></h1>
        <p>Want to understand how to build it yourself? Work with me on a real project and get comfortable using AI tools like Claude Code, one useful step at a time.</p>
      </div>
      <Link className="btn btn-fill" href="/contact?service=ai-coaching">Tell me what you want to learn ↗</Link>
      <p className="mt-5 text-sm text-[var(--color-ink-soft)]">Share your goals first. We agree on the session scope, price, and time before you commit.</p>
    </section>
    <section className="work-section"><div className="studio-wrap studio-section">
      <p className="eyebrow">Bring your curiosity. Bring your project.</p>
      <h2 className="display mt-5 text-4xl sm:text-5xl">Less guessing.<br/>More understanding.</h2>
      <div className="offer-grid mt-10">{[
        ["01", "Get started", "Make sense of the tools, set up a practical workflow, and turn a vague idea into a small, clear first task."],
        ["02", "Build together", "Work through a page, feature, or everyday workflow. Learn how to explain what you want and review what the AI produces."],
        ["03", "Get unstuck", "Bring an existing project. Walk through the issue together, test a focused change, and understand what to try next."],
      ].map(([n, title, description]) => <article className="offer-card" key={n}><p className="eyebrow">{n}</p><h3 className="display">{title}</h3><p>{description}</p></article>)}</div>
    </div></section>
    <section className="studio-wrap studio-section">
      <div className="section-heading"><p className="eyebrow">A session with a purpose</p><h2 className="display">Start where you are.<br/>Leave with a next step.</h2><p>This is personal, practical guidance. We choose a manageable goal for your experience level and work through it together.</p></div>
      <div className="process-list">{[
        ["01", "Tell me your goal", "Share what you want to make, what tools you have tried, and where you feel stuck. Beginners are welcome."],
        ["02", "Agree on the plan", "I’ll suggest a session scope and quote. We confirm the schedule and any tool accounts or subscriptions you’ll need beforehand."],
        ["03", "Work through it together", "Ask questions as we go. We finish with a recap and concrete next steps you can practice on your own."],
      ].map(([n, title, description]) => <div key={n}><span>{n}</span><div><h3>{title}</h3><p>{description}</p></div></div>)}</div>
    </section>
    <section className="studio-wrap faq-section"><div><p className="eyebrow">Before a session</p><h2 className="display">A few things<br/>to know.</h2></div><div>{[
      ["Do I need to know how to code?", "No. Tell me your starting point so we can choose an appropriate goal. More experienced builders can bring a specific project or question."],
      ["What tools can we work with?", "Claude Code and practical AI-assisted building workflows are a starting point. Tell me which tools you want to use, and I’ll confirm whether I can help before we book."],
      ["Will we finish my entire project in one session?", "We agree on a focused goal that fits the session. Larger projects may need more time; any follow-up work is agreed separately."],
      ["Can you just build it for me instead?", "Absolutely. Choose a website, custom software, or AI receptionist inquiry if you want me to handle the build. We can also discuss a build with a guided handoff."],
    ].map(([q, a]) => <details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
    <section className="closing-cta"><div className="studio-wrap"><p className="eyebrow">Let’s work on your idea</p><h2 className="display">Learn something.<br/><em>Make something.</em></h2><Link className="btn btn-fill" href="/contact?service=ai-coaching">Ask about coaching ↗</Link></div></section>
  </>;
}
