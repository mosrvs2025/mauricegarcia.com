import type { CSSProperties } from "react";

/** Nine particles on staggered, inward-spiralling orbits. Static, so it renders identically on server and client. */
const PARTICLES = Array.from({ length: 9 }, (_, i) => ({ a: (i * 40 + (i % 3) * 11) % 360, t: -(i * 0.15), d: 1.25 + (i % 4) * 0.12 }));

/**
 * The loader mark: a dark event-horizon core, a tilted accretion disk (back half behind the core, front half in
 * front), a lensing ring and particles falling inward. Pure markup, no JavaScript; all motion lives in
 * app/motion.css and is driven by the colour variables of the layer that contains it (--b accent, --hot highlight),
 * so the intro and the page curtain each give it their own palette. Size it with --s on a parent.
 */
export function BlackHole() {
  return (
    <span className="bh" aria-hidden="true">
      <i className="bh-halo" />
      <i className="bh-ring" />
      <span className="bh-disk bh-back"><i /></span>
      <i className="bh-core" />
      <span className="bh-disk bh-front"><i /></span>
      {PARTICLES.map((p, k) => <i key={k} className="bh-p" style={{ "--a": `${p.a}deg`, "--t": `${p.t}s`, "--d": `${p.d}s` } as CSSProperties} />)}
    </span>
  );
}
