"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type AnnotationKind = "decision" | "experiment" | "limitation";
const KIND_LABEL: Record<AnnotationKind, string> = { decision: "Engineering decision", experiment: "Experiment", limitation: "Limitation" };

/**
 * A case-file annotation (kept from the earlier Open Case identity, used in every skin): a small numbered marker that reveals one real note about a project,
 * an engineering decision, an experiment or an honest limitation. It is a disclosure button (aria-expanded), so it works
 * the same with a mouse, a finger or the keyboard (Enter and Space toggle it, Escape closes it, a click elsewhere closes it).
 * A mouse hovering over it previews the note, but nothing depends on hover.
 *
 * Rules for what goes inside: only facts the project's own content file or README already states, and `source` says which.
 * Nothing here is ever presented as verified beyond that source. Reduced motion needs no special case: the note simply
 * appears and disappears, with no transition.
 */
export function CaseAnnotation({ n, kind, label, source, align = "start", children }: {
  n: number | string; kind: AnnotationKind; label: string; source: string; align?: "start" | "end"; children: ReactNode;
}) {
  const id = useId();
  const [pin, setPin] = useState(false);     // opened by click, tap or keyboard: stays until closed
  const [peek, setPeek] = useState(false);    // previewed by a mouse hovering over it (never on touch screens)
  const open = pin || peek;
  const root = useRef<HTMLSpanElement>(null);
  const canHover = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setPin(false); setPeek(false); root.current?.querySelector("button")?.focus(); } };
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) { setPin(false); setPeek(false); } };
    document.addEventListener("keydown", onKey); document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open]);
  return (
    <span className={`ca ca-${kind}`} data-open={open || undefined} data-align={align} ref={root} onMouseEnter={() => { if (canHover()) setPeek(true); }} onMouseLeave={() => setPeek(false)}>
      <button type="button" className="ca-btn" aria-expanded={open} aria-controls={id} onClick={() => setPin(!pin)}>
        <span className="ca-mark" aria-hidden="true">{n}</span>
        <span className="ca-label"><span className="ca-kind">{KIND_LABEL[kind]}</span> {label}</span>
      </button>
      <span className="ca-panel" id={id} role="note">
        <span className="ca-panel-kind">{KIND_LABEL[kind]}</span>
        <span className="ca-body">{children}</span>
        <span className="ca-source">Source: {source}</span>
      </span>
    </span>
  );
}
