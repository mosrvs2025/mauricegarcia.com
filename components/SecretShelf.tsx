"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const OPEN_EVENT = "mg:open-secret-shelf";

/**
 * A second way in to the same shelf, for the byline at the top of the home page. On phones the hero is tall enough that
 * the inline trigger below the buttons can sit under the fold, so CSS swaps to this one (see .curiosity-switch--top).
 */
export function SecretShelfTrigger() {
  return (
    <button type="button" className="curiosity-switch curiosity-switch--top" aria-label="Discover the secret shelf" aria-haspopup="dialog"
      onClick={(event) => window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: event.currentTarget }))}>
      <span aria-hidden="true">✳</span><span className="curiosity-hint">Stay curious.</span>
    </button>
  );
}

/** A quiet, optional discovery. Native dialog provides focus trapping, Escape and inert background. */
export function SecretShelf() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const invoker = useRef<HTMLElement | null>(null);
  useEffect(() => {
    let word = "";
    let last = 0;
    const listen = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]")) return;
      if (event.key.length !== 1) return;
      const now = Date.now();
      word = (now - last > 1800 ? "" : word) + event.key.toLowerCase();
      word = word.slice(-7); last = now;
      if (word === "curious") { dialog.current?.showModal(); word = ""; }
    };
    const open = (event: Event) => { invoker.current = (event as CustomEvent<HTMLElement>).detail ?? null; dialog.current?.showModal(); };
    window.addEventListener("keydown", listen);
    window.addEventListener(OPEN_EVENT, open);
    return () => { window.removeEventListener("keydown", listen); window.removeEventListener(OPEN_EVENT, open); };
  }, []);
  return <>
    <button ref={trigger} type="button" className="curiosity-switch" aria-label="Discover the secret shelf" aria-haspopup="dialog" onClick={() => { invoker.current = trigger.current; dialog.current?.showModal(); }}><span aria-hidden="true">✳</span><span className="curiosity-hint">Stay curious.</span></button>
    <dialog ref={dialog} className="secret-shelf" aria-labelledby="secret-title" onClose={() => (invoker.current?.isConnected ? invoker.current : trigger.current)?.focus()} onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }}>
      <div className="secret-top"><span className="eyebrow">Hidden in plain sight / 001</span><button type="button" className="secret-close" aria-label="Close secret shelf" onClick={() => dialog.current?.close()}>×</button></div>
      <span className="secret-star" aria-hidden="true">✳</span>
      <h2 className="display" id="secret-title">Curiosity looks good on you.</h2>
      <p>A few doors off the main hallway. Pick one and see where it goes.</p>
      <div className="secret-doors">
        <Link href="/projects/swirl-room" onClick={() => dialog.current?.close()}><span>01 / Unwind</span><b>Play with fluid.</b><i aria-hidden="true">↗</i></Link>
        <Link href="/projects/chronos-time-laboratory" onClick={() => dialog.current?.close()}><span>02 / Wonder</span><b>Lose track of time.</b><i aria-hidden="true">↗</i></Link>
        <Link href="/lab" onClick={() => dialog.current?.close()}><span>03 / Explore</span><b>Enter the design lab.</b><i aria-hidden="true">↗</i></Link>
      </div>
      <p className="secret-footnote">Next time, type <kbd>curious</kbd> anywhere on this page.</p>
    </dialog>
  </>;
}
