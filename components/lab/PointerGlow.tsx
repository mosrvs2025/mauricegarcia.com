"use client";
import { useEffect, useRef } from "react";

/** A soft light that trails the pointer. Static (centered) with reduced motion. */
export function PointerGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = innerWidth / 2, y = innerHeight / 3, tx = x, ty = y, raf = 0;
    const move = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; };
    const tick = () => { x += (tx - x) * 0.08; y += (ty - y) * 0.08; el.style.transform = `translate(${x - 300}px, ${y - 300}px)`; raf = requestAnimationFrame(tick); };
    addEventListener("pointermove", move, { passive: true }); raf = requestAnimationFrame(tick);
    return () => { removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, []);
  return <div className="gl-bg" aria-hidden="true"><i /><i /><i /><div className="gl-light" ref={ref} /></div>;
}
