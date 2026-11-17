import { mulberry32, type Hole, type Shard } from "./weapons";

/**
 * Tiny repair crews: a few animals hop out after a blast, fetch debris that has come to rest and carry it back to
 * the hole, one chunk at a time, until the page heals. Pure logic (no canvas, no network): the stage draws them.
 * They are a flourish, so they only ever touch chunks that already stopped moving.
 */
export type Crew = {
  emoji: string; x: number; y: number; face: 1 | -1;
  state: "arrive" | "fetch" | "carry" | "work" | "leave";
  target: Shard | null; t: number; hop: number; speed: number; placedCount: number;
};

export const CREW_ARRIVE_MS = 1700;
const SPEED = 230;

export function crewSize(shardCount: number, reduced: boolean): number {
  if (reduced || shardCount < 30) return 0;
  return Math.min(3, 1 + Math.floor(shardCount / 140));
}

export function spawnCrew(hole: Hole, seed: number, count: number, emojis: readonly string[]): Crew[] {
  const r = mulberry32(seed ^ 0xc0ffee);
  return Array.from({ length: count }, (_, i) => {
    const a = r() * Math.PI * 2;
    return { emoji: emojis[Math.floor(r() * emojis.length)], x: hole.cx + Math.cos(a) * hole.rx * 1.1, y: hole.cy + Math.sin(a) * hole.ry * 1.1, face: 1, state: "arrive" as const, target: null, t: i * 0.35, hop: r() * 6, speed: SPEED * (0.85 + r() * 0.3), placedCount: 0 };
  });
}

/** Nearest settled chunk that nobody has claimed. */
function pick(c: Crew, shards: Shard[]): Shard | null {
  let best: Shard | null = null, bd = Infinity;
  for (const s of shards) {
    if (!s.rest || s.placed || s.carried) continue;
    const d = (s.x - c.x) ** 2 + (s.y - c.y) ** 2;
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

/** Move one crew member by dt seconds. `leaving` tells everyone to wrap up (the page is about to heal). */
export function stepCrew(c: Crew, shards: Shard[], dt: number, leaving: boolean) {
  c.hop += dt * 11; c.t += dt;
  const go = (tx: number, ty: number) => {
    const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 2) c.face = dx > 0 ? 1 : -1;
    if (d < 6) return true;
    const k = Math.min(1, (c.speed * dt) / d);
    c.x += dx * k; c.y += dy * k;
    return false;
  };
  if (leaving && c.state !== "leave") { if (c.target) { c.target.carried = false; c.target = null; } c.state = "leave"; c.t = 0; }
  switch (c.state) {
    case "arrive": if (c.t > 0.5) c.state = "fetch"; break;
    case "fetch": {
      if (!c.target) { c.target = pick(c, shards); if (!c.target) break; c.target.carried = true; }
      if (go(c.target.x, c.target.y)) c.state = "carry";
      break;
    }
    case "carry": {
      const s = c.target!;
      s.x = c.x; s.y = c.y - 16; s.rot = 0;
      if (go(s.ox, s.oy + 16)) { s.x = s.ox; s.y = s.oy; s.carried = false; s.placed = true; s.rest = true; c.target = null; c.placedCount++; c.state = "work"; c.t = 0; }
      break;
    }
    case "work": if (c.t > 0.45) c.state = "fetch"; break;
    case "leave": break;
  }
}

/** Crew members that should still be drawn (the leaving animation lasts 0.5 s). */
export const crewVisible = (c: Crew) => c.state !== "leave" || c.t < 0.5;
