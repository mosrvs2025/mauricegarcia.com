"use client";
import { useEffect } from "react";

/**
 * PARALLAX only: on fine pointers, the decorative hero planes drift by up to 12px with the pointer. It writes two
 * CSS variables (--drift-x, --drift-y, each -1..1) on the stage; CSS turns them into transforms, so nothing affects
 * layout. Off for touch, for reduced motion, and for every other skin.
 */
export function DepthDrift({ target }: { target: string }) {
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>(target);
    if (!stage) return;
    const fine = matchMedia("(pointer: fine)");
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    const reset = () => { stage.style.setProperty("--drift-x", "0"); stage.style.setProperty("--drift-y", "0"); };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !fine.matches || still.matches) return;
      if (document.documentElement.getAttribute("data-skin") !== "unauthorized-manual") return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = stage.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
        const y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
        stage.style.setProperty("--drift-x", x.toFixed(3));
        stage.style.setProperty("--drift-y", y.toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    stage.addEventListener("pointerleave", reset);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); stage.removeEventListener("pointerleave", reset); reset(); };
  }, [target]);
  return null;
}
