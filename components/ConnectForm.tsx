"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { contactEmail, INTENTS, type Intent } from "@/lib/contact";
import { services } from "@/lib/services";

const COPY: Record<Intent, { title: string; hint: string }> = {
  hello: { title: "Just saying hello", hint: "No agenda needed." },
  collaborate: { title: "Make something together", hint: "A project, a game, a tool, an idea." },
  "paid-work": { title: "Paid work", hint: "A website, an app, or a tool for your business." },
  coaching: { title: "Learn with me", hint: "A working session on your own idea with AI tools." },
};

export type ProjectOption = { slug: string; title: string };

export function ConnectForm({ initialIntent, initialService, initialProject, projects }: { initialIntent: Intent; initialService?: string; initialProject?: string; projects: ProjectOption[] }) {
  const [intent, setIntent] = useState<Intent>(initialIntent);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({ name: "", email: "", body: "" });
  const showService = intent === "paid-work" || intent === "coaching";
  const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(`Hello from the website (${COPY[intent].title})`)}&body=${encodeURIComponent(draft.body)}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    setStatus("sending"); setMessage("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || "Your message could not be sent.");
      track("connect_submit", { intent, project: String(payload.project || "") });
      form.reset(); setStatus("ok");
    } catch (error) {
      setStatus("err"); setMessage(error instanceof Error ? error.message : "Your message could not be sent.");
    }
  }

  if (status === "ok") return (
    <section role="status" className="j-ok">
      <h2 className="display" style={{ fontSize: "1.8rem" }}>Thank you. It's on its way to me.</h2>
      <p style={{ marginTop: 10 }}>I read everything and reply by email, usually within a few days. Nothing here commits you to anything.</p>
      <button type="button" className="btn btn-ghost" style={{ marginTop: 18 }} onClick={() => setStatus("idle")}>Send another</button>
    </section>
  );

  return (
    <form onSubmit={onSubmit} className="j-form" noValidate={false}>
      <fieldset>
        <legend>What brings you here?</legend>
        <div className="j-intents">
          {INTENTS.map((i) => (
            <label key={i} className="j-intent">
              <input type="radio" name="intent" value={i} checked={intent === i} onChange={() => { setIntent(i); track("connect_intent", { intent: i }); }} />
              <span><strong>{COPY[i].title}</strong><span className="j-muted">{COPY[i].hint}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      {showService && (
        <label>Which service? <span className="hint">(optional)</span>
          <select name="service" defaultValue={initialService || ""}>
            <option value="">Not sure yet</option>
            {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </label>
      )}

      <label>About a project? <span className="hint">(optional)</span>
        <select name="project" defaultValue={initialProject || ""}>
          <option value="">Nothing in particular</option>
          {projects.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
        </select>
      </label>

      <div className="j-two">
        <label>Your name<input required name="name" maxLength={100} autoComplete="name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
        <label>Email<input required type="email" name="email" maxLength={254} autoComplete="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
      </div>

      <label>Your message
        <textarea required name="body" maxLength={5000} rows={6} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          placeholder={intent === "hello" ? "Anything at all. What are you working on?" : intent === "paid-work" ? "What do you need, and what would make it a success?" : intent === "coaching" ? "What do you want to build, and what have you tried so far?" : "What would you like to try together?"} />
      </label>

      {intent === "paid-work" && (
        <details>
          <summary style={{ cursor: "pointer" }}>Add details that help me scope it <span className="hint">(all optional)</span></summary>
          <div style={{ display: "grid", gap: 18, marginTop: 16 }}>
            <label>Business or project name<input name="business" maxLength={200} autoComplete="organization" /></label>
            <label>Current website<input name="website" maxLength={500} placeholder="example.com" /></label>
            <div className="j-two">
              <label>Budget range, if you have one<select name="budget" defaultValue=""><option value="">Prefer to talk first</option><option>Under $1,000</option><option>$1,000–$3,000</option><option>$3,000–$5,000</option><option>$5,000–$10,000</option><option>$10,000+</option></select></label>
              <label>Timing<select name="timeline" defaultValue=""><option value="">Flexible</option><option>As soon as possible</option><option>Within a month</option><option>Within 3 months</option></select></label>
            </div>
          </div>
        </details>
      )}

      <div hidden aria-hidden="true"><label>Leave blank<input name="companyFax" tabIndex={-1} autoComplete="off" /></label></div>

      <div className="j-actions" style={{ marginTop: 0 }}>
        <button type="submit" disabled={status === "sending"} className="btn btn-fill">{status === "sending" ? "Sending…" : "Send message"}</button>
        <span className="j-muted">or email <a className="j-link" href={mailto}>{contactEmail}</a></span>
      </div>

      {status === "err" && (
        <div role="alert" className="j-error">
          <strong>That didn't go through.</strong> {message} Your message is still in the form. You can <a className="j-link" href={mailto}>email me directly</a> with the text already filled in.
        </div>
      )}
      <p className="j-muted" style={{ fontSize: ".9rem" }}>I use your details only to reply. No budget is needed for a friendly introduction.</p>
    </form>
  );
}
