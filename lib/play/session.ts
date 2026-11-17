import { identityFromId, roomFor, type Identity } from "./identity";
import { cursorInterval, KeyedLimiter, LIMITS, TokenBucket } from "./limiter";
import { encode, MIN_MOVE_X, MIN_MOVE_Y, parseInbound, type Msg, type WeaponId } from "./protocol";
import type { LinkStatus, RoomHandle, Transport } from "./transport";

export type SessionHooks = {
  onCursor(who: Identity & { id: string }, x: number, y: number): void;
  onTap(who: Identity & { id: string }, x: number, y: number): void;
  onBlast(who: Identity & { id: string }, w: WeaponId, x: number, y: number, seed: number): void;
  onPeers(count: number): void;
  onStatus(status: LinkStatus): void;
};

type Kind = "c" | "t" | "b";
const KINDS: Kind[] = ["c", "t", "b"];

/**
 * One visitor's connection to one page's room. It owns the outbound and inbound rate limits, the delta-only cursor
 * filter, the population-aware cursor rate, and message validation, and knows nothing about canvases, so it runs
 * under plain Node in tests. All limits here are client-side: they keep honest clients polite and make a
 * flood cheap to ignore, but they are not authoritative (a hostile client can skip its own limits).
 */
export class PlaySession {
  private handle: RoomHandle | null = null;
  private peers = 1;
  private status: LinkStatus = "offline";
  private suspended = false;
  private out = {} as Record<Kind, TokenBucket>;
  private inn = {} as Record<Kind, KeyedLimiter>;
  private total = {} as Record<Kind | "all", TokenBucket>;
  private lastCursor: { x: number; y: number } | null = null;
  private lastCursorAt = -Infinity;
  private room = "";
  readonly me: Identity & { id: string };

  constructor(private transport: Transport, readonly id: string, private hooks: SessionHooks, private now: () => number = () => Date.now()) {
    this.me = { id, ...identityFromId(id) };
    this.resetLimits();
  }

  private resetLimits() {
    const t = this.now();
    for (const k of KINDS) {
      this.out[k] = new TokenBucket(LIMITS.out[k][0], LIMITS.out[k][1], t);
      this.inn[k] = new KeyedLimiter(LIMITS.in[k][0], LIMITS.in[k][1]);
      this.total[k] = new TokenBucket(LIMITS.total[k][0], LIMITS.total[k][1], t);
    }
    this.total.all = new TokenBucket(LIMITS.total.all[0], LIMITS.total.all[1], t);
  }

  get online() { return this.status === "online"; }
  get peerCount() { return this.peers; }
  /** True when someone else is in the room and we are connected, so messages are worth sending. */
  get listening() { return this.canSend(); }
  /** Minimum ms between cursor messages right now (null: cursors are off because the room is crowded). */
  get cursorEvery() { return cursorInterval(this.peers); }

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
      onStatus: (s) => this.setStatus(s),
    });
  }

  private setStatus(s: LinkStatus) {
    const was = this.status;
    this.status = s;
    if (s === "online" && was !== "online") { this.resetLimits(); this.lastCursor = null; } // clean slate after (re)connecting
    if (s !== "online") { this.peers = 1; this.hooks.onPeers(1); }
    this.hooks.onStatus(s);
  }

  leave() {
    this.handle?.leave(); this.handle = null; this.room = ""; this.status = "offline";
  }

  /** While suspended (tab in the background) nothing is sent and everything received is dropped unread. */
  suspend(on: boolean) { this.suspended = on; }

  private canSend() { return !!this.handle && !this.suspended && this.status === "online" && this.peers > 1; }

  private send(msg: Msg): boolean {
    if (!this.canSend() || !this.out[msg.k].take(this.now())) return false;
    const { event, payload } = encode(msg);
    this.handle!.send(event, payload);
    return true;
  }

  /** Delta-only and population-aware: tiny movements and over-frequent updates never reach the limiter. */
  cursor(x: number, y: number): boolean {
    const every = this.cursorEvery;
    if (every === null) return false;
    const t = this.now();
    if (t - this.lastCursorAt < every) return false;
    const l = this.lastCursor;
    if (l && Math.abs(l.x - x) < MIN_MOVE_X && Math.abs(l.y - y) < MIN_MOVE_Y) return false;
    if (!this.send({ k: "c", id: this.id, x, y })) return false;
    this.lastCursor = { x, y }; this.lastCursorAt = t;
    return true;
  }
  tap(x: number, y: number) { return this.send({ k: "t", id: this.id, x, y }); }
  /** True when the blast was broadcast (it is simulated locally regardless, including when nobody is listening). */
  blast(w: WeaponId, x: number, y: number, seed: number) { return this.send({ k: "b", id: this.id, x, y, w, s: seed }); }

  private receive(event: string, payload: unknown) {
    if (this.suspended) return;
    const t = this.now();
    // Cheapest checks first, so a flood costs almost nothing: total budget, then shape, then per-kind and per-sender budgets.
    if (!this.total.all.take(t)) return;
    const msg = parseInbound(event, payload);
    if (!msg || msg.id === this.id) return;
    if (!this.total[msg.k].take(t) || !this.inn[msg.k].take(msg.id, t)) return;
    const who = { id: msg.id, ...identityFromId(msg.id) };
    if (msg.k === "c") this.hooks.onCursor(who, msg.x, msg.y);
    else if (msg.k === "t") this.hooks.onTap(who, msg.x, msg.y);
    else this.hooks.onBlast(who, msg.w, msg.x, msg.y, msg.s);
  }
}
