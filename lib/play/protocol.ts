import { ID_PATTERN } from "./identity";

export const WEAPON_IDS = ["blaster", "bomb", "laser", "hammer"] as const;
export type WeaponId = (typeof WEAPON_IDS)[number];

/** Pages are never taller than this; anything beyond is rejected as junk. */
export const MAX_Y = 60000;
/** Cursor deltas smaller than this are not worth a message (fraction of width, px of height). */
export const MIN_MOVE_X = 0.0015;
export const MIN_MOVE_Y = 2;

/**
 * Everything that crosses the wire. `x` is a fraction of the page width (0..1), `y` is pixels from the top of the
 * page, so a remote blast lands on the same spot of the page whatever the viewer's window size. Particle
 * positions are never sent: a blast is a weapon, a spot and a seed, and every client simulates it locally.
 */
export type Msg =
  | { k: "c"; id: string; x: number; y: number }
  | { k: "t"; id: string; x: number; y: number }
  | { k: "b"; id: string; x: number; y: number; w: WeaponId; s: number };

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Validates an untrusted inbound broadcast. Anything off-spec returns null; extra fields are dropped. */
export function parseInbound(event: unknown, payload: unknown): Msg | null {
  if (event !== "c" && event !== "t" && event !== "b") return null;
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.i !== "string" || !ID_PATTERN.test(p.i)) return null;
  if (!num(p.x) || !num(p.y) || p.x < -0.05 || p.x > 1.05 || p.y < 0 || p.y > MAX_Y) return null;
  const x = Math.min(1, Math.max(0, p.x));
  const y = p.y;
  if (event !== "b") return { k: event, id: p.i, x, y };
  if (typeof p.w !== "string" || !(WEAPON_IDS as readonly string[]).includes(p.w)) return null;
  if (!num(p.s) || !Number.isInteger(p.s) || p.s < 0 || p.s > 0xffffffff) return null;
  return { k: "b", id: p.i, x, y, w: p.w as WeaponId, s: p.s };
}

export function encode(msg: Msg): { event: string; payload: Record<string, unknown> } {
  const base = { i: msg.id, x: Math.round(msg.x * 10000) / 10000, y: Math.round(msg.y) };
  return { event: msg.k, payload: msg.k === "b" ? { ...base, w: msg.w, s: msg.s } : base };
}
