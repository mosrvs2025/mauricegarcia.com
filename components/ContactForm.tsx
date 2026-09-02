"use client";

import { useState } from "react";
import { services } from "@/lib/services";

export function ContactForm({ initialService }: { initialService?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      service: String(form.get("service") || ""),
      body: String(form.get("body") || ""),
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("fail");
      setStatus("ok");
      setMessage("Received. I will write back.");
      e.currentTarget.reset();
    } catch {
      setStatus("err");
      setMessage("Could not send through the site. Email hello@mauricegarcia.com.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <label className="block text-sm">
        Name
        <input
          required
          name="name"
          className="mt-1 w-full border border-[var(--color-rule)] px-3 py-3 outline-none focus:border-[var(--color-rust)]"
        />
      </label>
      <label className="block text-sm">
        Email
        <input
          required
          type="email"
          name="email"
          className="mt-1 w-full border border-[var(--color-rule)] px-3 py-3 outline-none focus:border-[var(--color-rust)]"
        />
      </label>
      <label className="block text-sm">
        Service
        <select
          name="service"
          defaultValue={initialService || ""}
          className="mt-1 w-full border border-[var(--color-rule)] px-3 py-3 outline-none focus:border-[var(--color-rust)]"
        >
          <option value="">General</option>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        What do you need built?
        <textarea
          required
          name="body"
          rows={6}
          className="mt-1 w-full border border-[var(--color-rule)] px-3 py-3 outline-none focus:border-[var(--color-rust)]"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn btn-fill disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send"}
      </button>
      {message ? <p className="text-sm text-[var(--color-ink-soft)]">{message}</p> : null}
    </form>
  );
}
