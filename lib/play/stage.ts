import { crewSize, crewVisible, spawnCrew, stepCrew, CREW_ARRIVE_MS, type Crew } from "./crew";
import { ANIMALS, identityFromId, type Identity } from "./identity";
import type { WeaponId } from "./protocol";
import { PlaySession } from "./session";
import { captureRegion, pagePalette, warmBackgrounds, type Capture } from "./snapshot";
import type { LinkStatus, Transport } from "./transport";
import { assignSources, beginHeal, healShard, HEAL_AT_MS, holeBounds, insideHole, LIFETIME_MS, HEAL_MS, makeHole, mulberry32, planShards, stepShard, WEAPONS, type Hole, type Shard, type WeaponSpec } from "./weapons";

/**
 * The canvas side of the playground: remote cursors, tap ripples and blasts. Everything is drawn on one fixed
 * canvas laid over the page. The real DOM is only ever read, never changed; a blast paints a dark crater over the
 * spot, throws chunks of an approximate snapshot around, then flies them home and lifts the crater.
 * The render loop sleeps whenever nothing is moving.
 */
export type StageOptions = {
  canvas: HTMLCanvasElement;
  transport: Transport | null;
  id: string;
  /** prefers-reduced-motion: no shake, flash or crews, fewer sparks. */
  reduced: boolean;
  /** Data Saver: procedural debris only (no page capture) and a small particle budget. */
  saver: boolean;
  onPeers(n: number): void;
  onPause?(paused: boolean): void;
  onStatus(s: LinkStatus): void;
  /** Called when a local shot goes off, with that weapon's cooldown in ms. */
  onFire(w: WeaponId, cooldown: number): void;
};

export type Stage = {
  me: Identity & { id: string };
  setPath(pathname: string): void;
  setWeapon(w: WeaponId | null): void;
  setReduced(r: boolean): void;
  destroy(): void;
};

type Blast = {
  spec: WeaponSpec; hole: Hole; shards: Shard[]; cap: Capture | null; palette: string[]; crew: Crew[] | null; seed: number;
  b: { left: number; top: number; width: number; height: number }; crater: HTMLCanvasElement;
  t0: number; floor: number; healing: boolean; label: { name: string; emoji: string; color: string } | null;
};
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string };
type Ripple = { x: number; y: number; t0: number; color: string };
type Cursor = { who: Identity; x: number; y: number; dx: number; dy: number; seen: number };

const MAX_BLASTS = 12, MAX_SPARKS = 320, MAX_CURSORS = 40;
const CURSOR_FADE_MS = 3500, CURSOR_GONE_MS = 6000, RIPPLE_MS = 700;
const HIDDEN_LEAVE_MS = 15000, IDLE_LEAVE_MS = 120000;
const CREW_EMOJI = ANIMALS.map((a) => a.emoji);

export function createStage(opts: StageOptions): Stage {
  const canvas = opts.canvas;
  const ctx = canvas.getContext("2d")!;
  const coarse = matchMedia("(pointer: coarse)").matches;
  // Phones get a lower pixel ratio and 300 to 500 chunks; Data Saver gets a small budget and no page capture at all.
  let dprCap = coarse ? 1.5 : 2;
  let shardCap = opts.saver ? 250 : coarse ? 400 : 900;
  let proceduralOnly = opts.saver;
  let reduced = opts.reduced;
  let dpr = 1, vw = 0, vh = 0;
  let weapon: WeaponId | null = null;
  let path = "";
  let raf = 0, timer = 0, last = 0, last2 = 0, destroyed = false;
  const blasts: Blast[] = []; const sparks: Spark[] = []; const ripples: Ripple[] = []; const cursors = new Map<string, Cursor>();
  const lastFire: Partial<Record<WeaponId, number>> = {};
  let lastInput = Date.now(), paused = false, hiddenTimer = 0, cursorTimer = 0;
  let pending: { x: number; y: number } | null = null;

  const docWidth = () => document.documentElement.clientWidth || window.innerWidth;
  const toDoc = (cx: number, cy: number) => ({ x: cx + window.scrollX, y: cy + window.scrollY });

  // ---- session (realtime) -------------------------------------------------------------------------------------
  const session = opts.transport ? new PlaySession(opts.transport, opts.id, {
    onCursor: (who, fx, y) => {
      if (document.hidden) return;
      const x = fx * docWidth(); const now = performance.now();
      const c = cursors.get(who.id);
      if (c) { c.x = x; c.y = y; c.seen = now; }
      else if (cursors.size < MAX_CURSORS) cursors.set(who.id, { who, x, y, dx: x, dy: y, seen: now });
      schedule();
    },
    onTap: (who, fx, y) => { if (!document.hidden) { addRipple(fx * docWidth(), y, who.color); schedule(); } },
    onBlast: (who, w, fx, y, seed) => { if (!document.hidden) addBlast(WEAPONS[w], fx * docWidth(), y, seed, who); },
    onPeers: (n) => { if (n <= 1) cursors.clear(); opts.onPeers(n); schedule(); },
    onStatus: (st) => { if (st !== "online") { cursors.clear(); schedule(); } opts.onStatus(st); }, // drop stale remote state on any disconnect
  }) : null;
  const me = session?.me ?? { id: opts.id, ...identityFromId(opts.id) };
  if (!session) opts.onStatus("offline");

  // ---- sizing -------------------------------------------------------------------------------------------------
  const size = () => {
    dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    vw = canvas.clientWidth || window.innerWidth; vh = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    schedule();
  };

  // ---- effects ------------------------------------------------------------------------------------------------
  function addRipple(x: number, y: number, color: string) {
    if (ripples.length < 24) ripples.push({ x, y, t0: performance.now(), color });
  }

  function craterFor(spec: WeaponSpec, hole: Hole, b: Blast["b"], scale: number, seed: number) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(b.width * scale); c.height = Math.ceil(b.height * scale);
    const g = c.getContext("2d")!; g.scale(scale, scale);
    const cx = hole.cx - b.left, cy = hole.cy - b.top;
    g.save(); g.translate(cx, cy); g.rotate(hole.angle); g.scale(1, hole.ry / hole.rx);
    const halo = g.createRadialGradient(0, 0, hole.rx * 0.8, 0, 0, hole.rx * 1.2);
    halo.addColorStop(0, "rgba(0,0,0,.55)"); halo.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = halo; g.beginPath(); g.arc(0, 0, hole.rx * 1.2, 0, Math.PI * 2); g.fill();
    g.restore();
    holePath(g, hole, cx, cy);
    const inner = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(hole.rx, hole.ry));
    inner.addColorStop(0, "#050407"); inner.addColorStop(0.75, "#0b0810"); inner.addColorStop(1, "#1a1320");
    g.fillStyle = inner; g.fill();
    if (spec.cracks) {
      const r = mulberry32(seed ^ 0x51ed);
      g.lineJoin = "round";
      for (let i = 0; i < 11; i++) {
        let a = (i / 11) * Math.PI * 2 + r() * 0.4; let d = 0; let x = cx, y = cy; const len = hole.rx * (1.0 + r() * 0.2);
        g.beginPath(); g.moveTo(x, y);
        while (d < len) { const step = 10 + r() * 16; a += (r() - 0.5) * 0.6; x += Math.cos(a) * step; y += Math.sin(a) * step; d += step; g.lineTo(x, y); }
        g.strokeStyle = "rgba(0,0,0,.85)"; g.lineWidth = 2.5; g.stroke();
        g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 1; g.stroke();
      }
    }
    return c;
  }

  function holePath(g: CanvasRenderingContext2D, hole: Hole, cx: number, cy: number) {
    const n = hole.profile.length; const co = Math.cos(hole.angle), si = Math.sin(hole.angle);
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i % n) / n * Math.PI * 2; const f = hole.profile[i % n];
      const lx = Math.cos(a) * hole.rx * f, ly = Math.sin(a) * hole.ry * f;
      const x = cx + lx * co - ly * si, y = cy + lx * si + ly * co;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
  }

  function shake(spec: WeaponSpec, seed: number) {
    if (reduced || document.querySelector("dialog[open]")) return;
    const r = mulberry32(seed ^ 0xabc);
    const n = 8; const frames: Keyframe[] = [{ transform: "translate(0,0)" }];
    for (let i = 1; i < n; i++) { const a = spec.shake * (1 - i / n); frames.push({ transform: `translate(${((r() - 0.5) * 2 * a).toFixed(1)}px,${((r() - 0.5) * 2 * a).toFixed(1)}px)` }); }
    frames.push({ transform: "translate(0,0)" });
    document.querySelectorAll<HTMLElement>("#main, .site-header, footer").forEach((el) => { try { el.animate(frames, { duration: spec.shakeMs, easing: "linear" }); } catch { /* ignore */ } });
  }

  function addBlast(spec: WeaponSpec, x: number, y: number, seed: number, who: (Identity & { id: string }) | null) {
    if (destroyed || blasts.length >= MAX_BLASTS) return;
    if (y < window.scrollY - 700 || y > window.scrollY + vh + 700) return;
    const hole = makeHole(spec, x, y, seed);
    const active = blasts.reduce((n, b) => n + (b.healing ? 0 : b.shards.length), 0);
    const live = blasts.filter((b) => !b.healing);
    const plan = planShards(spec, hole, seed, Math.max(0, shardCap - active), (sx, sy) => live.some((b) => insideHole(b.hole, sx, sy)));
    // Capture only the part of the blast that is on screen. Any failure, or a device that is struggling, means
    // procedural debris (themed chips) instead: the blast still happens and nothing waits on the page.
    let cap: Capture | null = null;
    if (plan.shards.length && !proceduralOnly) {
      try { cap = captureRegion(plan.b.left, plan.b.top, plan.b.width, plan.b.height, dpr); } catch { cap = null; }
      if (cap && cap.ms > 40 && ++slowCaptures >= 2) proceduralOnly = true; else if (cap && cap.ms <= 40) slowCaptures = 0;
    }
    assignSources(plan.shards, cap);
    const b = holeBounds(hole);
    const floor = Math.max(window.scrollY + vh - 6, y + spec.ry * 0.5);
    blasts.push({ spec, hole, shards: plan.shards, cap, palette: pagePalette(), crew: null, seed, b, crater: craterFor(spec, hole, b, dpr, seed), t0: performance.now(), floor, healing: false, label: who ? { name: who.name, emoji: who.emoji, color: who.color } : null });
    const r = mulberry32(seed ^ 0x5a5a);
    const count = Math.min(MAX_SPARKS - sparks.length, reduced ? Math.round(spec.sparks / 3) : spec.sparks);
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2; const v = (0.3 + r()) * spec.power * 0.8;
      sparks.push({ x, y, vx: Math.cos(a) * v * (spec.spread === "perp" ? 1.2 : 1), vy: Math.sin(a) * v - 120, life: 0, max: 450 + r() * 700, size: 2 + Math.floor(r() * 3), color: r() < 0.3 ? "#ffffff" : spec.color });
    }
    shake(spec, seed);
    schedule();
  }

  // ---- drawing ------------------------------------------------------------------------------------------------
  function frame(now: number) {
    raf = 0;
    if (destroyed) return;
    const dt = Math.min(0.033, Math.max(0.001, (now - (last || now - 16)) / 1000)); last = now;
    const sx = window.scrollX, sy = window.scrollY;
    governor(now - (last2 || now), blasts.reduce((n, b) => n + b.shards.length, 0)); last2 = now;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    let busy = false;

    for (let bi = blasts.length - 1; bi >= 0; bi--) {
      const bl = blasts[bi]; const age = now - bl.t0;
      if (age >= LIFETIME_MS) { blasts.splice(bi, 1); continue; }
      busy = true;
      if (age >= HEAL_AT_MS && !bl.healing) { bl.healing = true; for (const s of bl.shards) beginHeal(s); }
      const p = bl.healing ? (age - HEAL_AT_MS) / HEAL_MS : 0;
      if (!bl.healing) for (const s of bl.shards) stepShard(s, dt, bl.floor);
      // crater and scorch
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = bl.healing ? Math.max(0, 1 - Math.max(0, p - 0.45) / 0.55) : Math.min(1, age / 60);
      ctx.drawImage(bl.crater, Math.round(bl.b.left - sx), Math.round(bl.b.top - sy), bl.b.width, bl.b.height);
      // repair crew: arrives once the debris has settled, fetches chunks and carries them home, leaves before the heal
      if (!reduced && !bl.crew && !bl.healing && age > CREW_ARRIVE_MS) bl.crew = spawnCrew(bl.hole, bl.seed, crewSize(bl.shards.length, reduced), CREW_EMOJI);
      if (bl.crew) for (const c of bl.crew) stepCrew(c, bl.shards, dt, bl.healing || age > HEAL_AT_MS - 700);
      // chunks (captured page pieces, or themed chips where there is no capture)
      {
        const sz = bl.shards.length ? bl.shards[0].size : 0; const cap = bl.cap; const sc = cap ? cap.scale : 1;
        for (const s of bl.shards) {
          if (bl.healing) healShard(s, p);
          const px = Math.round(s.x - sx), py = Math.round(s.y - sy);
          if (px < -sz - 4 || px > vw + sz + 4 || py < -sz - 4 || py > vh + sz + 4) continue;
          const cs = Math.cos(s.rot), sn = Math.sin(s.rot);
          ctx.setTransform(dpr * cs, dpr * sn, -dpr * sn, dpr * cs, px * dpr, py * dpr);
          if (!s.proc && cap) ctx.drawImage(cap.canvas, (s.sx) * sc, (s.sy) * sc, s.size * sc, s.size * sc, -s.size / 2, -s.size / 2, s.size, s.size);
          else { ctx.globalAlpha = s.ci === 3 ? 0.55 : 0.95; ctx.fillStyle = bl.palette[s.ci]; ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size); ctx.globalAlpha = 1; }
        }
      }
      if (bl.crew) for (const c of bl.crew) if (crewVisible(c)) drawCrew(c, sx, sy);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1;
      // fire, flash, shockwave
      if (age < 1800 && !bl.healing) drawGlow(bl, age, sx, sy);
      if (bl.label && age < 1700) drawTag(bl.label, bl.hole.cx - sx, bl.hole.cy - sy - Math.max(bl.hole.ry, 30) - 14 - age * 0.012, 1 - age / 1700);
    }

    // sparks
    if (sparks.length) {
      busy = true; ctx.globalCompositeOperation = "lighter"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]; s.life += dt * 1000;
        if (s.life >= s.max) { sparks.splice(i, 1); continue; }
        s.vy += 900 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 1 - 1.2 * dt;
        ctx.globalAlpha = 1 - s.life / s.max; ctx.fillStyle = s.color; ctx.fillRect(Math.round(s.x - sx), Math.round(s.y - sy), s.size, s.size);
      }
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    }

    // tap ripples
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i]; const t = (now - r.t0) / RIPPLE_MS;
      if (t >= 1) { ripples.splice(i, 1); continue; }
      busy = true; const e = 1 - Math.pow(1 - t, 3);
      ctx.strokeStyle = r.color; ctx.globalAlpha = (1 - t) * 0.9; ctx.lineWidth = 3 * (1 - t) + 1;
      ctx.beginPath(); ctx.arc(r.x - sx, r.y - sy, 6 + e * 44, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = (1 - t) * 0.35; ctx.fillStyle = r.color; ctx.beginPath(); ctx.arc(r.x - sx, r.y - sy, 4 + e * 12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // remote cursors
    for (const [id, c] of cursors) {
      const age = now - c.seen;
      if (age > CURSOR_GONE_MS) { cursors.delete(id); continue; }
      const k = 1 - Math.exp(-dt / (Math.hypot(c.x - c.dx, c.y - c.dy) > 400 ? 0.04 : 0.11)); // glide toward the last known spot (updates arrive about 4 times a second)
      if (Math.abs(c.x - c.dx) > 0.3 || Math.abs(c.y - c.dy) > 0.3) { c.dx += (c.x - c.dx) * k; c.dy += (c.y - c.dy) * k; busy = true; } else { c.dx = c.x; c.dy = c.y; }
      if (age > CURSOR_FADE_MS) busy = true;
      const a = age > CURSOR_FADE_MS ? 1 - (age - CURSOR_FADE_MS) / (CURSOR_GONE_MS - CURSOR_FADE_MS) : 1;
      drawCursor(c, c.dx - sx, c.dy - sy, a);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (busy) schedule(); else if (cursors.size) timer = window.setTimeout(() => { timer = 0; schedule(); }, 500);
  }

  function drawCrew(c: Crew, sx: number, sy: number) {
    const x = c.x - sx, y = c.y - sy;
    if (x < -30 || x > vw + 30 || y < -30 || y > vh + 30) return;
    const moving = c.state === "fetch" || c.state === "carry" || c.state === "arrive" ? 1 : 0;
    const hop = moving ? Math.abs(Math.sin(c.hop)) * 6 : 0;
    const k = c.state === "leave" ? Math.max(0, 1 - c.t / 0.5) : Math.min(1, c.t / 0.25 + 0.2);
    ctx.setTransform(dpr * c.face * k, 0, 0, dpr * k, x * dpr, (y - hop) * dpr);
    ctx.font = "18px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(c.emoji, 0, 0);
    ctx.fillStyle = "#ffb020"; ctx.beginPath(); ctx.arc(0, -8, 7, Math.PI, 0); ctx.fill(); ctx.fillRect(-8, -8, 16, 2); // tiny hard hat
    if (c.state === "work") { ctx.save(); ctx.rotate(Math.sin(c.t * 22) * 0.7 - 0.3); ctx.font = "11px system-ui, 'Apple Color Emoji', sans-serif"; ctx.fillText("🔨", 12, -2); ctx.restore(); }
    ctx.textAlign = "start";
  }

  /**
   * If frames stay slow while debris is flying, quietly spend less, in steps: a lower pixel ratio and fewer chunks,
   * then no more page captures (procedural chips), then a much smaller budget. Frame time includes the browser's
   * own compositing, so this reacts to what the visitor actually feels, not just to our own code.
   */
  let slowFrames = 0, slowCaptures = 0, degraded = 0;
  function governor(dtMs: number, chunks: number) {
    if (chunks < 100 || dtMs > 500) { slowFrames = Math.max(0, slowFrames - 1); return; } // idle gaps and tab switches are not jank
    slowFrames = dtMs > 40 ? slowFrames + 1 : Math.max(0, slowFrames - 2);
    if (slowFrames < 20 || degraded >= 3) return;
    degraded++; slowFrames = 0;
    shardCap = Math.max(120, Math.round(shardCap * 0.6));
    if (degraded === 1) { dprCap = Math.min(dprCap, 1.25); size(); }
    else if (degraded === 2) { dprCap = 1; proceduralOnly = true; size(); }
  }

  function drawGlow(bl: Blast, age: number, sx: number, sy: number) {
    const { spec, hole } = bl; const cx = hole.cx - sx, cy = hole.cy - sy;
    ctx.globalCompositeOperation = "lighter";
    if (!reduced && age < 170) {
      const a = 1 - age / 170; const R = Math.max(hole.rx, hole.ry) * (spec.id === "laser" ? 0.6 : 1.1);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, `rgba(255,255,255,${0.9 * a})`); g.addColorStop(0.35, hexA(spec.color, 0.55 * a)); g.addColorStop(1, hexA(spec.color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    }
    if (spec.id === "laser" && age < 260) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(hole.angle); ctx.globalAlpha = 1 - age / 260; ctx.fillStyle = spec.color; ctx.fillRect(-hole.rx * 1.25, -2, hole.rx * 2.5, 4); ctx.fillStyle = "#fff"; ctx.fillRect(-hole.rx * 1.25, -1, hole.rx * 2.5, 2); ctx.restore();
    }
    if (spec.ring && age < 650) {
      const t = age / 650; const e = 1 - Math.pow(1 - t, 3);
      ctx.strokeStyle = spec.color; ctx.globalAlpha = (1 - t) * 0.8; ctx.lineWidth = 8 * (1 - t) + 1;
      ctx.beginPath(); ctx.arc(cx, cy, hole.rx * (0.3 + e * 1.35), 0, Math.PI * 2); ctx.stroke();
    }
    if (age < 1800) {
      const a = (1 - age / 1800) * 0.9; ctx.globalAlpha = a; ctx.strokeStyle = spec.color;
      holePath(ctx, hole, cx, cy); ctx.lineWidth = 5; ctx.globalAlpha = a * 0.3; ctx.stroke(); ctx.lineWidth = 2; ctx.globalAlpha = a; ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }

  function hexA(hex: string, a: number) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

  function drawCursor(c: Cursor, x: number, y: number, a: number) {
    if (x < -120 || x > vw + 120 || y < -40 || y > vh + 40) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = c.who.color; ctx.strokeStyle = "rgba(10,8,12,.9)"; ctx.lineWidth = 1.5; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 17); ctx.lineTo(x + 4.5, y + 13); ctx.lineTo(x + 8, y + 20.5); ctx.lineTo(x + 11, y + 19); ctx.lineTo(x + 7.6, y + 12); ctx.lineTo(x + 13, y + 12); ctx.closePath();
    ctx.fill(); ctx.stroke();
    drawTag({ name: c.who.name, emoji: c.who.emoji, color: c.who.color }, x + 16, y + 26, a, true);
    ctx.globalAlpha = 1;
  }

  function drawTag(t: { name: string; emoji: string; color: string }, x: number, y: number, a: number, left = false) {
    ctx.font = "600 12px system-ui, -apple-system, 'Segoe UI', sans-serif"; ctx.textBaseline = "middle";
    const text = `${t.emoji} ${t.name}`; const w = ctx.measureText(text).width + 14;
    const px = left ? x : x - w / 2;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = t.color; ctx.beginPath(); if (typeof ctx.roundRect === "function") ctx.roundRect(px, y - 11, w, 22, 11); else ctx.rect(px, y - 11, w, 22); ctx.fill();
    ctx.fillStyle = "#120d14"; ctx.fillText(text, px + 7, y + 0.5);
    ctx.globalAlpha = 1;
  }

  function schedule() {
    if (destroyed || raf) return;
    if (timer) { clearTimeout(timer); timer = 0; }
    raf = requestAnimationFrame(frame);
  }

  // ---- input --------------------------------------------------------------------------------------------------
  const touch = (e: Event) => { lastInput = Date.now(); if (paused) resume(); void e; };

  // Cursors go out at 4 per second while moving (fewer as the room fills: see cursorInterval), always ending on the latest position.
  let lastFlush = -Infinity;
  function flushCursor() {
    cursorTimer = 0;
    if (!pending || !session) return;
    const p = pending; pending = null; lastFlush = performance.now();
    session.cursor(Math.min(1, Math.max(0, p.x / docWidth())), p.y);
  }
  function queueCursor(minDelay = 0) {
    const every = session?.cursorEvery;
    if (cursorTimer || !every) return;
    cursorTimer = window.setTimeout(flushCursor, Math.max(minDelay, every - (performance.now() - lastFlush)));
  }
  const onMove = (e: PointerEvent) => {
    touch(e);
    if (!session || (e.pointerType === "touch" && e.buttons === 0)) return;
    pending = toDoc(e.clientX, e.clientY);
    queueCursor();
  };
  const onDown = (e: PointerEvent) => {
    touch(e);
    if (weapon || (e.target as Element | null)?.closest?.("[data-play]")) return;
    const p = toDoc(e.clientX, e.clientY);
    addRipple(p.x, p.y, me.color); schedule();
    session?.tap(Math.min(1, Math.max(0, p.x / docWidth())), p.y);
    if (e.pointerType === "touch") { pending = p; queueCursor(40); }
  };

  function fire(clientX: number, clientY: number) {
    if (!weapon) return;
    const spec = WEAPONS[weapon]; const now = performance.now();
    if (now - (lastFire[weapon] ?? -1e9) < spec.cooldown || blasts.length >= MAX_BLASTS) return;
    const p = toDoc(clientX, clientY);
    const seed = (crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0;
    const listening = !!session?.listening;
    const sent = session?.blast(spec.id, Math.min(1, Math.max(0, p.x / docWidth())), p.y, seed) ?? false;
    if (listening && !sent) return; // over the send budget: nobody would see it, so it does not happen
    lastFire[weapon] = now;
    opts.onFire(weapon, spec.cooldown);
    addBlast(spec, p.x, p.y, seed, null);
  }

  let touchStart: { x: number; y: number; t: number } | null = null;
  const cDown = (e: PointerEvent) => {
    touch(e); if (!weapon) return;
    if (e.pointerType === "mouse") { fire(e.clientX, e.clientY); return; }
    touchStart = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const cUp = (e: PointerEvent) => {
    const s = touchStart; touchStart = null;
    if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) < 12 && performance.now() - s.t < 600) fire(e.clientX, e.clientY);
  };
  const cCancel = () => { touchStart = null; };
  const onScroll = () => { if (blasts.length || cursors.size || ripples.length) schedule(); clearTimeout(scrollTimer); scrollTimer = window.setTimeout(warm, 600); };
  const onKey = (e: Event) => touch(e);

  // ---- connection hygiene: leave when hidden or idle so idle tabs never hold a connection slot -----------------
  function pause() { if (paused) return; paused = true; session?.leave(); cursors.clear(); opts.onPause?.(true); schedule(); }
  function resume() { if (!paused) return; paused = false; lastInput = Date.now(); opts.onPause?.(false); if (path) session?.join(path); }
  // Background tabs stop sending and drop everything they receive at once, and leave the room after a short while.
  const onVisibility = () => {
    if (document.hidden) { session?.suspend(true); cursors.clear(); hiddenTimer = window.setTimeout(pause, HIDDEN_LEAVE_MS); }
    else { clearTimeout(hiddenTimer); session?.suspend(false); resume(); schedule(); }
  };
  const idleTimer = window.setInterval(() => { if (!document.hidden && Date.now() - lastInput > IDLE_LEAVE_MS) pause(); }, 15000);

  // Warm the cache of CSS background images while the browser is idle, so the first blast already has them.
  let warmTimer = 0;
  const warm = () => {
    if (proceduralOnly || document.hidden) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(() => { try { warmBackgrounds(); } catch { /* optional */ } }, { timeout: 3000 }); else warmTimer = window.setTimeout(() => { try { warmBackgrounds(); } catch { /* optional */ } }, 1500);
  };
  let scrollTimer = 0;

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true, capture: true });
  window.addEventListener("keydown", onKey, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", size, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("pointerdown", cDown); canvas.addEventListener("pointerup", cUp); canvas.addEventListener("pointercancel", cCancel);
  size(); warm();

  return {
    me,
    setPath(p) {
      if (p === path) return; path = p;
      blasts.length = 0;
      sparks.length = 0; ripples.length = 0; cursors.clear(); schedule(); warm();
      if (!paused) session?.join(p);
    },
    setWeapon(w) { weapon = w; },
    setReduced(r) { reduced = r; },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); clearTimeout(timer); clearTimeout(cursorTimer); clearTimeout(hiddenTimer); clearInterval(idleTimer); clearTimeout(warmTimer); clearTimeout(scrollTimer);
      session?.leave();
      window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerdown", onDown, { capture: true } as EventListenerOptions);
      window.removeEventListener("keydown", onKey); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", cDown); canvas.removeEventListener("pointerup", cUp); canvas.removeEventListener("pointercancel", cCancel);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
