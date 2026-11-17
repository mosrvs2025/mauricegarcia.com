import { identityFromId, roomFor, type Identity } from "./identity";
import { KeyedLimiter, LIMITS, TokenBucket } from "./limiter";
import { encode, MIN_MOVE_X, MIN_MOVE_Y, parseInbound, type Msg, type WeaponId } from "./protocol";
import type { LinkStatus, RoomHandle, Transport } from "./transport";

export type SessionHooks = {
  onCursor(who: Identity & { id: string }, x: number, y: number): void;
  onTap(who: Identity & { id: string }, x: number, y: number): void;
  onBlast(who: Identity & { id: string }, w: WeaponId, x: number, y: number, seed: number): void;
  onPeers(count: number): void;
  onStatus(status: LinkStatus): void;
};

/**
 * One visitor's connection to one page's room. It owns the outbound and inbound rate limits, the delta-only cursor
 * filter and message validation, and knows nothing about canvases, so it runs under plain Node in tests.
 */
export class PlaySession {
  private handle: RoomHandle | null = null;
  private peers = 1;
  private status: LinkStatus = "offline";
  private out = {} as Record<"c" | "t" | "b", TokenBucket>;
  private inn = {} as Record<"c" | "t" | "b", KeyedLimiter>;
  private lastCursor: { x: number; y: number } | null = null;
  private room = "";
  readonly me: Identity & { id: string };

  constructor(private transport: Transport, readonly id: string, private hooks: SessionHooks, private now: () => number = () => Date.now()) {
    this.me = { id, ...identityFromId(id) };
    this.resetLimits();
  }

  private resetLimits() {
    const t = this.now();
    for (const k of ["c", "t", "b"] as const) {
      this.out[k] = new TokenBucket(LIMITS.out[k][0], LIMITS.out[k][1], t);
      this.inn[k] = new KeyedLimiter(LIMITS.in[k][0], LIMITS.in[k][1]);
    }
  }

  get online() { return this.status === "online"; }
  get peerCount() { return this.peers; }

  /** Join (or switch to) the room for a page. */
  join(pathname: string) {
    const room = roomFor(pathname);
    if (room === this.room && this.handle) return;
    this.leave();
    this.room = room; this.peers = 1; this.lastCursor = null;
    this.hooks.onPeers(1);
    this.handle = this.transport.join(room, this.id, {
      onMessage: (event, payload) => this.receive(event, payload),
      onPresence: (ids) => { this.peers = Math.max(1, ids.length); this.hooks.onPeers(this.peers); },
      onStatus: (s) => { this.status = s; if (s !== "online") { this.peers = 1; this.hooks.onPeers(1); } this.hooks.onStatus(s); },
    });
  }

  leave() {
    this.handle?.leave(); this.handle = null; this.room = ""; this.status = "offline";
  }

  /** Only talk when someone else is listening: an empty room costs nothing. */
  private canSend() { return !!this.handle && this.status === "online" && this.peers > 1; }

  private send(msg: Msg): boolean {
    if (!this.canSend() || !this.out[msg.k].take(this.now())) return false;
    const { event, payload } = encode(msg);
    this.handle!.send(event, payload);
    return true;
  }

  /** Delta-only: tiny movements are dropped before they even reach the rate limiter. */
  cursor(x: number, y: number): boolean {
    const l = this.lastCursor;
    if (l && Math.abs(l.x - x) < MIN_MOVE_X && Math.abs(l.y - y) < MIN_MOVE_Y) return false;
    if (!this.send({ k: "c", id: this.id, x, y })) return false;
    this.lastCursor = { x, y };
    return true;
  }
  tap(x: number, y: number) { return this.send({ k: "t", id: this.id, x, y }); }
  /** Returns the seed to use locally when the blast is allowed (it is simulated locally even when nobody is listening). */
  blast(w: WeaponId, x: number, y: number, seed: number) { return this.send({ k: "b", id: this.id, x, y, w, s: seed }); }

  private receive(event: string, payload: unknown) {
    const msg = parseInbound(event, payload);
    if (!msg || msg.id === this.id) return;
    if (!this.inn[msg.k].take(msg.id, this.now())) return;
    const who = { id: msg.id, ...identityFromId(msg.id) };
    if (msg.k === "c") this.hooks.onCursor(who, msg.x, msg.y);
    else if (msg.k === "t") this.hooks.onTap(who, msg.x, msg.y);
    else this.hooks.onBlast(who, msg.w, msg.x, msg.y, msg.s);
  }
}
