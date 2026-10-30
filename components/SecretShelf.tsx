"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/** A quiet, optional discovery. Native dialog provides focus trapping, Escape and inert background. */
export function SecretShelf() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
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
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);
  return <>
    <button ref={trigger} type="button" className="curiosity-switch" aria-label="Discover the secret shelf" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}><span aria-hidden="true">✳</span><span className="curiosity-hint">Stay curious.</span></button>
    <dialog ref={dialog} className="secret-shelf" aria-labelledby="secret-title" onClose={() => trigger.current?.focus()} onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }}>
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
