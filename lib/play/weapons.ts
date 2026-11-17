import type { WeaponId } from "./protocol";

/** Small deterministic PRNG so every client builds the same blast from the same seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export type WeaponSpec = {
  id: WeaponId; label: string; blurb: string; key: string;
  rx: number; ry: number; tile: number; power: number; lift: number; spread: "radial" | "perp" | "drop";
  color: string; shake: number; shakeMs: number; cooldown: number; cracks: boolean; ring: boolean; sparks: number; tilt: boolean;
};

export const WEAPONS: Record<WeaponId, WeaponSpec> = {
  blaster: { id: "blaster", label: "Blaster", blurb: "A tight plasma pop", key: "1", rx: 78, ry: 78, tile: 10, power: 520, lift: 120, spread: "radial", color: "#5ef2ff", shake: 4, shakeMs: 240, cooldown: 180, cracks: false, ring: false, sparks: 26, tilt: false },
  bomb: { id: "bomb", label: "Bomb", blurb: "Big boom, big crater", key: "2", rx: 168, ry: 168, tile: 16, power: 860, lift: 360, spread: "radial", color: "#ff9a3d", shake: 14, shakeMs: 560, cooldown: 1100, cracks: false, ring: true, sparks: 60, tilt: false },
  laser: { id: "laser", label: "Laser", blurb: "Slices a hot line", key: "3", rx: 250, ry: 22, tile: 8, power: 300, lift: 60, spread: "perp", color: "#ff3d85", shake: 3, shakeMs: 200, cooldown: 420, cracks: false, ring: false, sparks: 40, tilt: true },
  hammer: { id: "hammer", label: "Hammer", blurb: "Cracks it, drops it", key: "4", rx: 118, ry: 118, tile: 13, power: 240, lift: 200, spread: "drop", color: "#ffd24a", shake: 9, shakeMs: 380, cooldown: 620, cracks: true, ring: true, sparks: 24, tilt: false },
};

export const HEAL_AT_MS = 8600;
export const HEAL_MS = 1400;
export const LIFETIME_MS = HEAL_AT_MS + HEAL_MS;
export const GRAVITY = 1900;

/** A ragged outline: radius multipliers by angle, smoothed so the hole looks chipped rather than spiky. */
export function holeProfile(rand: () => number, n = 40): number[] {
  const raw = Array.from({ length: n }, () => 0.84 + rand() * 0.3);
  return raw.map((_, i) => (raw[(i + n - 1) % n] + raw[i] * 2 + raw[(i + 1) % n]) / 4);
}

export type Hole = { cx: number; cy: number; rx: number; ry: number; angle: number; profile: number[] };

export function makeHole(spec: WeaponSpec, cx: number, cy: number, seed: number): Hole {
  const r = mulberry32(seed);
  const angle = spec.tilt ? (r() - 0.5) * 0.5 : 0;
  return { cx, cy, rx: spec.rx, ry: spec.ry, angle, profile: holeProfile(r) };
}

/** Is a document point inside the (ragged) hole? */
export function insideHole(h: Hole, x: number, y: number): boolean {
  const dx = x - h.cx, dy = y - h.cy;
  const c = Math.cos(-h.angle), s = Math.sin(-h.angle);
  const lx = dx * c - dy * s, ly = dx * s + dy * c;
  const nx = lx / h.rx, ny = ly / h.ry;
  const d = Math.hypot(nx, ny);
  if (d === 0) return true;
  const a = (Math.atan2(ny, nx) + Math.PI * 2) % (Math.PI * 2);
  const f = (a / (Math.PI * 2)) * h.profile.length;
  const i = Math.floor(f) % h.profile.length, j = (i + 1) % h.profile.length;
  const edge = h.profile[i] + (h.profile[j] - h.profile[i]) * (f - Math.floor(f));
  return d <= edge;
}

/** Bounding box of the hole, with a margin, in document coordinates. */
export function holeBounds(h: Hole, margin = 0) {
  const c = Math.cos(h.angle), s = Math.sin(h.angle);
  const hw = Math.hypot(h.rx * c, h.ry * s) * 1.18 + margin, hh = Math.hypot(h.rx * s, h.ry * c) * 1.18 + margin;
  return { left: h.cx - hw, top: h.cy - hh, width: hw * 2, height: hh * 2 };
}

export type Shard = {
  sx: number; sy: number; size: number; // source square inside the snapshot, in CSS px
  ox: number; oy: number; // home (document) position of the centre
  x: number; y: number; vx: number; vy: number; rot: number; vr: number;
  rest: boolean; hx: number; hy: number; hr: number; delay: number; // delay in 0..1 of the heal window
};

/** Cut the hole into square chunks and give each one its first push. Deterministic for a given seed. */
export function planShards(spec: WeaponSpec, hole: Hole, seed: number, maxShards: number, skip: (x: number, y: number) => boolean = () => false) {
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const b = holeBounds(hole);
  let tile = spec.tile;
  const estimate = (t: number) => Math.PI * hole.rx * hole.ry / (t * t);
  while (estimate(tile) > maxShards && tile < 40) tile += 2;
  if (estimate(tile) > maxShards * 1.2) return { shards: [] as Shard[], tile, b };
  const shards: Shard[] = [];
  const reach = Math.max(hole.rx, hole.ry);
  for (let ty = Math.floor(b.top / tile) * tile; ty < b.top + b.height; ty += tile) {
    for (let tx = Math.floor(b.left / tile) * tile; tx < b.left + b.width; tx += tile) {
      const cx = tx + tile / 2, cy = ty + tile / 2;
      if (!insideHole(hole, cx, cy) || skip(cx, cy)) continue;
      const dx = cx - hole.cx, dy = cy - hole.cy;
      const dist = Math.hypot(dx, dy) || 1;
      const near = 1 - Math.min(1, dist / reach);
      let vx: number, vy: number;
      if (spec.spread === "radial") {
        const k = spec.power * (0.35 + 0.65 * near) * (0.6 + rand() * 0.55);
        vx = (dx / dist) * k; vy = (dy / dist) * k - spec.lift * rand();
      } else if (spec.spread === "perp") {
        const side = dy >= 0 ? 1 : -1; const k = spec.power * (0.4 + rand() * 0.8);
        vx = (rand() - 0.5) * 200; vy = side * k - spec.lift * rand();
      } else {
        vx = (dx / dist) * spec.power * (0.2 + rand() * 0.5); vy = -spec.lift * (0.2 + rand() * 0.8);
      }
      const delay = Math.min(1, (dist / reach) * 0.75 + rand() * 0.25);
      shards.push({ sx: cx - tile / 2 - b.left, sy: cy - tile / 2 - b.top, size: tile, ox: cx, oy: cy, x: cx, y: cy, vx, vy, rot: 0, vr: (rand() - 0.5) * 10, rest: false, hx: cx, hy: cy, hr: 0, delay });
    }
  }
  return { shards, tile, b };
}

/** Advance one shard by dt seconds (dt is clamped by the caller). The floor is a document y. */
export function stepShard(s: Shard, dt: number, floorY: number) {
  if (s.rest) return;
  s.vy += GRAVITY * dt;
  const drag = Math.max(0, 1 - 0.7 * dt);
  s.vx *= drag;
  s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
  const bottom = floorY - s.size / 2;
  if (s.y > bottom) {
    s.y = bottom;
    if (Math.abs(s.vy) < 90) { s.rest = true; s.vx = 0; s.vy = 0; s.vr = 0; return; }
    s.vy = -s.vy * 0.3; s.vx *= 0.72; s.vr *= 0.55;
  }
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Remember where a shard ended up so it can fly home. */
export function beginHeal(s: Shard) { s.hx = s.x; s.hy = s.y; s.hr = s.rot; s.rest = true; }

/** Staggered rebuild: p runs 0..1 over the heal window; each shard starts after its own delay. Returns true when home. */
export function healShard(s: Shard, p: number): boolean {
  const start = s.delay * 0.55;
  const t = Math.min(1, Math.max(0, (p - start) / (1 - 0.55)));
  const e = easeInOut(t);
  const turns = Math.round(s.hr / (Math.PI * 2)) * Math.PI * 2;
  s.x = s.hx + (s.ox - s.hx) * e; s.y = s.hy + (s.oy - s.hy) * e; s.rot = s.hr + (turns - s.hr) * e;
  return t >= 1;
}
