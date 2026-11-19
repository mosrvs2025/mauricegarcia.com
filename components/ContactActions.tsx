"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { contactEmail } from "@/lib/contact";
import { LEGACY_PREFIXES } from "@/lib/skin";

/** Copies text, falling back to a hidden textarea where the async clipboard API is missing or blocked. */
async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  try {
    const t = document.createElement("textarea");
    t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(t); t.select();
    const ok = document.execCommand("copy");
    t.remove();
    return ok;
  } catch { return false; }
}

const Mail = () => <svg className="cx-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.5 6.5h17v11h-17z M3.5 7l8.5 6.5L20.5 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
const Copy = () => <svg className="cx-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8.5 8.5h11v11h-11z M5 15.5H4.5v-11h11V5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
const Check = () => <svg className="cx-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/**
 * The one pair of contact shortcuts, used everywhere: in the navigation, in the phone rail and at the top of /connect.
 * "Email me" opens the visitor's mail app; "Copy email" copies the address and says so in a live region (the button's
 * own label changes too, so the state never depends on colour). Every identity restyles the same markup.
 */
export function ContactActions({ variant }: { variant: "nav" | "rail" | "page" }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const onCopy = async () => {
    const ok = await copyText(contactEmail);
    setState(ok ? "copied" : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), ok ? 2400 : 6000);
  };
  return (
    <div className={`cx cx--${variant}`} role="group" aria-label="Email Maurice">
      <a className="cx-btn cx-email j-pressable" href={`mailto:${contactEmail}`} data-track="contact_email" data-track-place={variant}>
        <Mail /><span className="cx-label">Email me</span>
      </a>
      <button type="button" className="cx-btn cx-copy j-pressable" onClick={onCopy} data-state={state} data-track="contact_copy" data-track-place={variant}>
        {state === "copied" ? <Check /> : <Copy />}<span className="cx-label">{state === "copied" ? "Copied" : "Copy email"}</span>
      </button>
      <span className="cx-status" role="status" aria-live="polite">
        {state === "copied" ? "Email copied." : state === "failed" ? `Couldn't copy. The address is ${contactEmail}.` : ""}
      </span>
    </div>
  );
}

/**
 * Phones only (CSS shows it at 760px and below): a compact fixed rail with Email and Copy, above the safe area.
 * Hidden on /connect, where the same two actions are at the top of the page, and on the older standalone pages.
 */
export function ContactRail() {
  const path = usePathname() || "/";
  if (LEGACY_PREFIXES.test(path) || path.startsWith("/connect")) return null;
  return <div className="cx-rail"><ContactActions variant="rail" /></div>;
}
