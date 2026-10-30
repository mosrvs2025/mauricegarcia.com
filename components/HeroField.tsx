"use client";
import { useEffect, useRef } from "react";

/**
 * Decorative interactive grid (a nod to Gridheart's health-as-cells idea): cells glow near the pointer,
 * and a tap or click sends a ripple through them. Draws only while on screen and pauses when the tab is
 * hidden. With reduced motion it paints one still frame. Purely decorative, so it is hidden from assistive tech.
 */
export function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 30; const GAP = 4;
    let w = 0, h = 0, cols = 0, rows = 0, dpr = 1;
    const pointer = { x: -999, y: -999, active: false };
    const ripples: { x: number; y: number; t: number }[] = [];
    let raf = 0, visible = true, last = 0;
    let acc = "255,122,77", txt = "243,237,227";
    const colors = () => { const cs = getComputedStyle(document.documentElement); acc = cs.getPropertyValue("--j-accent-rgb").trim() || acc; txt = cs.getPropertyValue("--j-text-rgb").trim() || txt; };
    colors();

    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = host.clientWidth; h = host.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = c * CELL + CELL / 2, y = r * CELL + CELL / 2;
        let glow = 0.05 + 0.03 * Math.sin(t / 1400 + c * 0.6 + r * 0.9);
        if (pointer.active) { const d = Math.hypot(x - pointer.x, y - pointer.y); if (d < 150) glow += (1 - d / 150) ** 2 * 0.85; }
        for (const rp of ripples) { const age = (t - rp.t) / 900; const d = Math.hypot(x - rp.x, y - rp.y); const ring = Math.abs(d - age * 520); if (age < 1 && ring < 38) glow += (1 - ring / 38) * (1 - age) * 0.9; }
        const hot = Math.min(glow, 1);
        ctx.fillStyle = hot > 0.2 ? `rgba(${acc},${Math.min(0.15 + hot * 0.75, 0.95)})` : `rgba(${txt},${0.05 + hot * 0.3})`;
        const s = CELL - GAP; ctx.beginPath(); ctx.roundRect(x - s / 2, y - s / 2, s, s, 5); ctx.fill();
      }
      while (ripples.length && t - ripples[0].t > 900) ripples.shift();
    };
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || t - last < 33) return; // ~30fps is plenty and keeps phones cool
      last = t; draw(t);
    };
    const rel = (e: PointerEvent) => { const b = host.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    const move = (e: PointerEvent) => { const p = rel(e); pointer.x = p.x; pointer.y = p.y; pointer.active = p.y >= 0 && p.y <= h; };
    const leave = () => { pointer.active = false; };
    const down = (e: PointerEvent) => { const p = rel(e); if (p.y >= 0 && p.y <= h) ripples.push({ ...p, t: performance.now() }); };

    size();
    const onSkin = () => { colors(); if (reduce) draw(0); };
    window.addEventListener("mg-skin", onSkin);
    if (reduce) { draw(0); const ro = new ResizeObserver(() => { size(); draw(0); }); ro.observe(host); return () => { ro.disconnect(); window.removeEventListener("mg-skin", onSkin); }; }
    const ro = new ResizeObserver(size); ro.observe(host);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(host);
    const vis = () => { visible = !document.hidden; };
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mg-skin", onSkin); cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", vis); window.removeEventListener("pointermove", move); window.removeEventListener("pointerdown", down); document.removeEventListener("pointerleave", leave); };
  }, []);
  return <canvas ref={ref} className="j-field" aria-hidden="true" />;
}
