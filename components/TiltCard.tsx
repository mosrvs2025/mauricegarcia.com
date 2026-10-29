"use client";
import { useRef, type ReactNode } from "react";

/** A few degrees of pointer-follow tilt on fine pointers. No effect on touch or with reduced motion. */
export function TiltCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const ok = () => typeof matchMedia !== "undefined" && matchMedia("(hover:hover) and (pointer:fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div className="j-tilt" ref={ref}
      onPointerMove={(e) => { const el = ref.current; if (!el || !ok()) return; const b = el.getBoundingClientRect(); const x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5; el.style.transform = `perspective(1100px) rotateY(${x * 5}deg) rotateX(${-y * 4}deg) translateZ(0)`; el.style.setProperty("--mx", `${(x + 0.5) * 100}%`); el.style.setProperty("--my", `${(y + 0.5) * 100}%`); }}
      onPointerLeave={() => { if (ref.current) ref.current.style.transform = ""; }}>
      {children}
    </div>
  );
}
