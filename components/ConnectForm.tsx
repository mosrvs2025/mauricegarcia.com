"use client";
import { useEffect, useId, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { CONTACT_LIMITS, EMAIL_PATTERN, contactEmail } from "@/lib/contact";

type Errors = { message?: string; email?: string };

function validate(message: string, email: string): Errors {
  const errors: Errors = {};
  const m = message.trim(), e = email.trim();
  if (!m) errors.message = "Write a message first.";
  else if (m.length < CONTACT_LIMITS.messageMin) errors.message = `A little more, please: at least ${CONTACT_LIMITS.messageMin} characters.`;
  else if (m.length > CONTACT_LIMITS.messageMax) errors.message = `That's over ${CONTACT_LIMITS.messageMax.toLocaleString("en-US")} characters. Please shorten it, or email me directly.`;
  if (!e) errors.email = "Add your email so I can reply.";
  else if (!EMAIL_PATTERN.test(e) || e.length > CONTACT_LIMITS.emailMax) errors.email = "That email address doesn't look right.";
  return errors;
}

/**
 * The one contact form: a message and an email (both required), and an optional name behind a small disclosure.
 * Posts to /api/contact and shows success only after the server confirms delivery. On failure the message stays in
 * the form and a direct email link carries it.
 */
export function ConnectForm() {
  const uid = useId();
  const ids = { message: `${uid}-message`, email: `${uid}-email`, name: `${uid}-name`, mErr: `${uid}-message-err`, eErr: `${uid}-email-err`, count: `${uid}-count` };
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [showName, setShowName] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  // Revealing the optional name moves focus into it (only after a click, never on first render).
  const revealed = useRef(false);
  useEffect(() => { if (showName && revealed.current) nameRef.current?.focus(); revealed.current = true; }, [showName]);
  const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent("Hello from your website")}&body=${encodeURIComponent(message)}`;

  function onStart() { if (!started.current) { started.current = true; track("connect_start", {}); } }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validate(message, email);
    setErrors(found); setTried(true);
    if (found.message) { messageRef.current?.focus(); return; }
    if (found.email) { emailRef.current?.focus(); return; }
    const companyFax = String(new FormData(e.currentTarget).get("companyFax") || "");
    setStatus("sending"); setReason("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: message.trim(), email: email.trim(), name: name.trim(), companyFax }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(typeof result.error === "string" ? result.error : "");
      track("connect_submit", {});
      setMessage(""); setEmail(""); setName(""); setShowName(false); setTried(false); setErrors({});
      setStatus("ok");
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      track("connect_error", {});
      setStatus("err"); setReason(error instanceof Error ? error.message : "");
      requestAnimationFrame(() => resultRef.current?.focus());
    }
  }

  const recheck = (m: string, em: string) => { if (tried) setErrors(validate(m, em)); };

  if (status === "ok") return (
    <div ref={resultRef} tabIndex={-1} role="status" className="connect-done">
      <p className="connect-done-title display">Message sent. Thanks for reaching out.</p>
      <p className="j-muted">I read every message myself and reply by email.</p>
      <button type="button" className="btn btn-ghost j-pressable" onClick={() => setStatus("idle")}>Send another message</button>
    </div>
  );

  const left = CONTACT_LIMITS.messageMax - message.length;
  return (
    <form onSubmit={onSubmit} onFocus={onStart} className="j-form connect-form" noValidate aria-describedby={status === "err" ? `${uid}-fail` : undefined}>
      <div className="cf-field">
        <label htmlFor={ids.message}>Your message</label>
        <textarea ref={messageRef} id={ids.message} name="message" required minLength={CONTACT_LIMITS.messageMin} maxLength={CONTACT_LIMITS.messageMax} rows={7}
          value={message} onChange={(e) => { setMessage(e.target.value); recheck(e.target.value, email); }}
          aria-invalid={errors.message ? true : undefined} aria-describedby={[errors.message ? ids.mErr : "", ids.count].filter(Boolean).join(" ")} />
        <div className="cf-under">
          {errors.message ? <p className="cf-err" id={ids.mErr}>{errors.message}</p> : <span />}
          <p className="cf-count" id={ids.count}>{left < 300 ? `${left.toLocaleString("en-US")} characters left` : `Up to ${CONTACT_LIMITS.messageMax.toLocaleString("en-US")} characters`}</p>
        </div>
      </div>

      <div className="cf-field">
        <label htmlFor={ids.email}>Your email</label>
        <input ref={emailRef} id={ids.email} type="email" name="email" required maxLength={CONTACT_LIMITS.emailMax} autoComplete="email" inputMode="email" spellCheck={false}
          value={email} onChange={(e) => { setEmail(e.target.value); recheck(message, e.target.value); }}
          aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? ids.eErr : undefined} />
        {errors.email && <p className="cf-err" id={ids.eErr}>{errors.email}</p>}
      </div>

      <div className="cf-field cf-name">
        <button type="button" className="cf-disclose j-pressable" aria-expanded={showName} aria-controls={`${uid}-name-wrap`}
          onClick={() => setShowName(!showName)}>
          <span aria-hidden="true" className="cf-disclose-mark">{showName ? "−" : "+"}</span>Add your name <span className="cf-optional">(optional)</span>
        </button>
        <div id={`${uid}-name-wrap`} hidden={!showName}>
          <label htmlFor={ids.name}>Your name <span className="cf-optional">(optional)</span></label>
          <input ref={nameRef} id={ids.name} name="name" maxLength={CONTACT_LIMITS.nameMax} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>

      <div hidden aria-hidden="true"><label>Leave blank<input name="companyFax" tabIndex={-1} autoComplete="off" /></label></div>

      <div className="cf-submit">
        <button type="submit" disabled={status === "sending"} className="btn btn-fill j-pressable">{status === "sending" ? "Sending…" : "Send message"}</button>
      </div>

      <div ref={resultRef} tabIndex={-1} className="cf-result">
        {status === "err" && (
          <div role="alert" className="j-error" id={`${uid}-fail`}>
            <p><strong>Couldn&apos;t send your message.</strong> You can <a className="j-link" href={mailto}>email me directly</a> instead. Your message is still in the form.</p>
            {reason && <p className="cf-reason">{reason}</p>}
          </div>
        )}
      </div>
    </form>
  );
}
