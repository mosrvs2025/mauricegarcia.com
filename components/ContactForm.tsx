"use client";
import { useState } from "react";
import { services } from "@/lib/services";
import { contactEmail } from "@/lib/contact";
const control = "mt-2 w-full border border-[var(--color-rule)] px-3 py-3 focus:outline-2 focus:outline-[var(--color-rust)]";
export function ContactForm({ initialService }: { initialService?: string }) {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    setStatus("sending"); setMessage("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not send your inquiry.");
      form.reset(); setStatus("ok");
    } catch (error) {
      setStatus("err"); setMessage(error instanceof Error ? error.message : "Could not send your inquiry. Please try again.");
    }
  }
  if (status === "ok") return <section role="status" className="border border-[var(--color-rust)] p-8"><p className="stamp">Inquiry sent</p><h2 className="display mt-4 text-3xl">Your project starts here.</h2><p className="mt-4">Thanks for the brief. I will review it and reply by email to discuss the scope and next steps. No payment is due.</p><button className="btn btn-ghost mt-6" onClick={() => { setStatus("idle"); setStep(1); }}>Plan another project</button></section>;
  return <form onSubmit={onSubmit} className="space-y-6">
    <p className="stamp" aria-live="polite">Step {step} of 2 · {step === 1 ? "Your project" : "How to reach you"}</p>
    <fieldset hidden={step !== 1} className="space-y-5">
      <legend className="display mb-5 text-3xl">What would you like to build?</legend>
      <label className="block">I need<select name="service" defaultValue={initialService || "business-website"} className={control}>{services.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}<option value="">Help figuring it out</option></select></label>
      <label className="block">Business or project name (optional)<input name="business" maxLength={200} autoComplete="organization" className={control}/></label>
      <label className="block">Current website (optional)<input name="website" maxLength={500} placeholder="example.com" className={control}/></label>
      <div className="grid gap-5 sm:grid-cols-2"><label>Budget range<select name="budget" className={control}><option>Not sure yet</option><option>Under $1,000</option><option>$1,000–$3,000</option><option>$3,000–$5,000</option><option>$5,000–$10,000</option><option>$10,000+</option></select></label><label>Ideal timing<select name="timeline" className={control}><option>Flexible</option><option>As soon as possible</option><option>Within a month</option><option>Within 3 months</option></select></label></div>
    </fieldset>
    <fieldset hidden={step !== 2} disabled={step !== 2 || status === "sending"} className="space-y-5">
      <legend className="display mb-5 text-3xl">Tell me about your idea.</legend>
      <label className="block">Your name<input required name="name" maxLength={100} autoComplete="name" className={control}/></label>
      <label className="block">Email<input required type="email" name="email" maxLength={254} autoComplete="email" className={control}/></label>
      <label className="block">What should your website help people do?<textarea required name="body" maxLength={5000} rows={5} placeholder="For example: learn about my services, book an appointment, buy a product, or request a quote." className={control}/></label>
      <p className="text-sm text-[var(--color-ink-soft)]">Your details are used to respond to this inquiry. Submitting a brief does not commit you to a purchase.</p>
    </fieldset>
    <div hidden aria-hidden="true"><label>Leave blank<input name="companyFax" tabIndex={-1} autoComplete="off"/></label></div>
    <div className="flex flex-wrap gap-3">{step === 2 && <button type="button" disabled={status === "sending"} onClick={() => setStep(1)} className="btn btn-ghost">Back</button>}<button type="submit" disabled={status === "sending"} className="btn btn-fill disabled:opacity-60">{status === "sending" ? "Sending…" : step === 1 ? "Continue →" : "Send project brief"}</button></div>
    {message && <p role="alert">{message} Your details are still here.</p>}
    <p className="text-sm text-[var(--color-ink-soft)]">Prefer email? <a className="underline break-all" href={`mailto:${contactEmail}`}>{contactEmail}</a></p>
  </form>;
}
