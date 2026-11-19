"use client";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Spatial depth container for the homepage hero (`j-scene`).
 * Only active for PARALLAX (`unauthorized-manual`) on pointer-fine devices without reduced motion.
 * Shifts `--px` and `--py` by up to 12px via transforms only — zero layout thrashing, disabled on touch.
 */
export function SpatialStage({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const reset = () => {
      el.style.setProperty("--px", "0px");
      el.style.setProperty("--py", "0px");
    };

    const isParallax = () => document.documentElement.getAttribute("data-skin") === "unauthorized-manual";

    const onMove = (e: PointerEvent) => {
      if (!fine.matches || reduced.matches || !isParallax()) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", `${(nx * 12).toFixed(2)}px`);
        el.style.setProperty("--py", `${(ny * 12).toFixed(2)}px`);
      });
    };

    const onSkin = () => { if (!isParallax()) reset(); };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", reset, { passive: true });
    window.addEventListener("mg-skin", onSkin);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      window.removeEventListener("mg-skin", onSkin);
      reset();
    };
  }, []);

  return (
    <div ref={ref} className={`j-scene ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}
