"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LEGACY_PREFIXES } from "@/lib/skin";

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy execCommand fallback
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;left:-9999px;opacity:0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Shared Email + Copy split control.
 * - `variant="nav"`: persistent desktop navigation contact shortcut.
 * - `variant="page"`: primary immediate actions at the top of /connect.
 */
export function ContactSplitControl({
  email,
  variant = "nav",
}: {
  email: string;
  variant?: "nav" | "page";
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  async function onCopy() {
    const ok = await copyText(email);
    if (!ok) return;
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2600);
  }

  return (
    <div className={`c-split c-split--${variant}`} role="group" aria-label="Direct email actions">
      <a
        href={`mailto:${email}`}
        className="c-split-mail j-pressable"
        data-track={variant === "page" ? "connect_mailto" : "nav_mailto"}
      >
        <span className="c-split-ic" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2.5 4.2 8 8.4l5.5-4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>Email me</span>
      </a>
      <button
        type="button"
        className={`c-split-copy j-pressable${copied ? " is-copied" : ""}`}
        onClick={onCopy}
        data-track={variant === "page" ? "connect_copy" : "nav_copy"}
      >
        <span className="c-split-ic" aria-hidden="true">
          {copied ? (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5 6.4 11.8 13 4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="5" width="8.5" height="8.5" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 10.5V3.8A1.3 1.3 0 0 1 4.3 2.5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </span>
        <span>{copied ? "Email copied." : "Copy email"}</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {copied ? "Email copied." : ""}
      </span>
    </div>
  );
}

/**
 * Compact fixed two-action mobile rail for Email and Copy, respecting env(safe-area-inset-bottom).
 * Hidden on /connect (where those same actions sit at the top of the page) and on legacy routes.
 */
export function MobileContactRail({ email }: { email: string }) {
  const path = usePathname() || "/";
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  if (LEGACY_PREFIXES.test(path) || path.startsWith("/connect")) return null;

  async function onCopy() {
    const ok = await copyText(email);
    if (!ok) return;
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2600);
  }

  return (
    <div className="m-contact-rail" role="region" aria-label="Quick contact">
      <div className="m-contact-rail-inner j-surface">
        <a href={`mailto:${email}`} className="m-rail-btn m-rail-mail j-pressable" data-track="mobile_rail_mailto">
          <span className="c-split-ic" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2.5 4.2 8 8.4l5.5-4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>Email me</span>
        </a>
        <button
          type="button"
          className={`m-rail-btn m-rail-copy j-pressable${copied ? " is-copied" : ""}`}
          onClick={onCopy}
          data-track="mobile_rail_copy"
        >
          <span className="c-split-ic" aria-hidden="true">
            {copied ? (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5 6.4 11.8 13 4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="5" width="8.5" height="8.5" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 10.5V3.8A1.3 1.3 0 0 1 4.3 2.5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <span>{copied ? "Email copied." : "Copy email"}</span>
        </button>
      </div>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {copied ? "Email copied." : ""}
      </span>
    </div>
  );
}
