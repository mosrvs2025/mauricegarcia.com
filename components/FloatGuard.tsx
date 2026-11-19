"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** How much of the bottom of the viewport the floating Playground pill can occupy, plus a margin. */
const BAND = 88;

/**
 * Lets the floating controls step aside instead of covering content. Anything marked `data-float-clear` (the hero's
 * curiosity row, the Selected work header and its selector) sets `data-float-clear` on <html> while any part of it is in
 * the bottom band of the screen; CSS then fades the floating controls out (see "Floating controls" in journal.css).
 * They come back as soon as the content scrolls out of that band. Controls that have focus, or are in use, stay put.
 */
export function FloatGuard() {
  const path = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    const marked = Array.from(document.querySelectorAll("[data-float-clear]"));
    if (!marked.length || !("IntersectionObserver" in window)) return;
    const hits = new Set<Element>();
    let io: IntersectionObserver | null = null;
    const build = () => {
      io?.disconnect(); hits.clear();
      io = new IntersectionObserver((entries) => {
        for (const e of entries) { if (e.isIntersecting) hits.add(e.target); else hits.delete(e.target); }
        if (hits.size) root.setAttribute("data-float-clear", ""); else root.removeAttribute("data-float-clear");
      }, { rootMargin: `-${Math.max(0, window.innerHeight - BAND)}px 0px 0px 0px` });
      marked.forEach((el) => io?.observe(el));
    };
    build();
    window.addEventListener("resize", build);
    return () => { window.removeEventListener("resize", build); io?.disconnect(); root.removeAttribute("data-float-clear"); };
  }, [path]);
  return null;
}
