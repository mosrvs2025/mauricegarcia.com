"use client";
import { useState, type ReactNode } from "react";

/**
 * "Break it": points the visitor at the Playground's own control and nudges it. It never enters the Playground for
 * them. Entering stays an explicit click on the Playground's entry card, which carries the privacy notice, so the
 * existing opt-in is untouched. If the Playground is switched off or not on this page, it says so.
 */
export function PlaygroundTrigger({ children }: { children: ReactNode }) {
  const [missing, setMissing] = useState(false);
  const go = () => {
    const target = document.querySelector<HTMLElement>(".play-dock .play-enter, .play-dock .play-fab, .play-dock .play-btn:not(.play-off)");
    if (!target) { setMissing(true); return; }
    setMissing(false);
    target.setAttribute("data-nudge", ""); // first, so the floating controls do not step aside (and become unfocusable) as it gains focus
    target.focus();
    window.setTimeout(() => target.removeAttribute("data-nudge"), 2400);
  };
  return (
    <>
      <button type="button" className="hero-verb-btn" onClick={go} aria-describedby={missing ? "play-missing" : undefined}>{children}</button>
      {missing && <span id="play-missing" role="status" className="hero-verb-note">The Playground isn&apos;t available on this page.</span>}
    </>
  );
}
