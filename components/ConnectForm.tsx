"use client";
import { useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { contactEmail, MESSAGE_MAX, MESSAGE_MIN, NAME_MAX } from "@/lib/contact";

export function ConnectForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showName, setShowName] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const nameInput = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent("Hello from mauricegarcia.com")}${message.trim() ? `&body=${encodeURIComponent(message.trim())}` : ""}`;

  function onStart() {
    if (!started.current) {
      started.current = true;
      track("connect_start", {});
    }
  }

  function toggleName() {
    const next = !showName;
    setShowName(next);
    if (next) {
      requestAnimationFrame(() => nameInput.current?.focus());
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const payload = {
      message: message.trim(),
      email: email.trim(),
      name: showName ? name.trim() : "",
      companyFax: String(formData.get("companyFax") || ""),
    };

    if (payload.message.length < MESSAGE_MIN) {
      setStatus("err");
      setErrorMessage("Please write at least 10 characters so I have enough context to reply.");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(typeof result.error === "string" && result.error ? result.error : "Couldn't send your message. You can email me directly instead.");
      }
      track("connect_submit", {});
      setMessage("");
      setEmail("");
      setName("");
      setShowName(false);
      setStatus("ok");
    } catch {
      track("connect_error", {});
      setStatus("err");
      setErrorMessage("Couldn't send your message. You can email me directly instead.");
    }
  }

  if (status === "ok") {
    return (
      <section role="status" aria-live="polite" className="j-ok j-surface connect-panel">
        <p className="connect-status-lead">Message sent. Thanks for reaching out.</p>
        <button type="button" className="btn btn-ghost j-pressable" style={{ marginTop: 18 }} onClick={() => setStatus("idle")}>
          Send another message
        </button>
      </section>
    );
  }

  return (
    <div className="j-surface connect-panel">
      <form onSubmit={onSubmit} onFocus={onStart} className="j-form connect-form" noValidate={false}>
        <div className="connect-field">
          <label htmlFor="connect-message">Your message</label>
          <textarea
            id="connect-message"
            name="message"
            required
            minLength={MESSAGE_MIN}
            maxLength={MESSAGE_MAX}
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share an idea, a question, or what you're working on."
            aria-describedby="connect-message-hint"
            className="j-inset"
          />
          <p id="connect-message-hint" className="hint connect-field-hint">
            10–3,000 characters.
          </p>
        </div>

        <div className="connect-field">
          <label htmlFor="connect-email">Your email</label>
          <input
            id="connect-email"
            type="email"
            name="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="j-inset"
          />
        </div>

        <div className="connect-name-disclosure">
          <button
            type="button"
            className="connect-disclosure-btn"
            aria-expanded={showName}
            aria-controls="connect-name-panel"
            onClick={toggleName}
          >
            <span aria-hidden="true">{showName ? "−" : "+"}</span>
            <span>Add your name (optional)</span>
          </button>
          {showName && (
            <div id="connect-name-panel" className="connect-field connect-name-panel">
              <label htmlFor="connect-name">Your name <span className="hint">(optional)</span></label>
              <input
                ref={nameInput}
                id="connect-name"
                type="text"
                name="name"
                maxLength={NAME_MAX}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="j-inset"
              />
            </div>
          )}
        </div>

        <div hidden aria-hidden="true">
          <label htmlFor="connect-fax">Leave blank</label>
          <input id="connect-fax" name="companyFax" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="connect-submit-row">
          <button type="submit" disabled={status === "sending"} className="btn btn-fill j-pressable">
            {status === "sending" ? "Sending…" : "Send message"}
          </button>
        </div>

        {status === "err" && (
          <div role="alert" aria-live="assertive" className="j-error">
            <p>
              {errorMessage || "Couldn't send your message. You can email me directly instead."}{" "}
              <a className="j-link" href={mailto}>Email {contactEmail}</a>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
