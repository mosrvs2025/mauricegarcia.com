"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LEGACY_PREFIXES } from "@/lib/skin";

/** A small "Let's talk" button that stays in reach on every page, with the fastest ways to get in touch. */
export function QuickContact({ email }: { email: string }) {
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); button.current?.focus(); } };
    const onClick = (e: MouseEvent) => { if (!panel.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);

  if (LEGACY_PREFIXES.test(path) || path.startsWith("/connect")) return null;

  const copy = async () => {
    try { await navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="qc">
      {open && (
        <div ref={panel} className="qc-panel" role="dialog" aria-label="Get in touch">
          <p className="qc-title">Let&apos;s talk.</p>
          <p className="qc-sub">Tell me what you&apos;re building. I read every message myself.</p>
          <Link className="btn btn-fill qc-main" href="/connect?intent=paid-work" data-track="quick_contact" onClick={() => setOpen(false)}>Start a project</Link>
          <div className="qc-row">
            <a className="qc-mail" href={`mailto:${email}`} data-track="quick_email">{email}</a>
            <button type="button" className="qc-copy" onClick={copy} aria-live="polite">{copied ? "Copied ✓" : "Copy"}</button>
          </div>
          <Link className="j-link qc-hello" href="/connect" onClick={() => setOpen(false)}>Or just say hello →</Link>
        </div>
      )}
      <button ref={button} type="button" className="qc-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="qc-dot" aria-hidden="true" />{open ? "Close" : "Let's talk"}
      </button>
    </div>
  );
}
