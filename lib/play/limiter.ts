/** Token bucket: `rate` tokens per second, up to `burst` stored. Time is injected so tests need no clock. */
export class TokenBucket {
  private tokens: number;
  private last: number;
  constructor(private rate: number, private burst: number, now: number) { this.tokens = burst; this.last = now; }
  take(now: number): boolean {
    this.tokens = Math.min(this.burst, this.tokens + Math.max(0, now - this.last) * this.rate / 1000);
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

/** One bucket per key (a remote sender). The map is capped so a flood of fake ids cannot grow memory. */
export class KeyedLimiter {
  private buckets = new Map<string, TokenBucket>();
  constructor(private rate: number, private burst: number, private maxKeys = 200) {}
  take(key: string, now: number): boolean {
    let b = this.buckets.get(key);
    if (!b) {
      if (this.buckets.size >= this.maxKeys) { const first = this.buckets.keys().next().value; if (first !== undefined) this.buckets.delete(first); }
      b = new TokenBucket(this.rate, this.burst, now);
      this.buckets.set(key, b);
    }
    return b.take(now);
  }
  forget(key: string) { this.buckets.delete(key); }
}

/** Outbound and inbound budgets, per message kind. Receivers enforce theirs too: there is no server in the middle. */
export const LIMITS = {
  out: { c: [12, 3], t: [3, 4], b: [2.5, 3] },
  in: { c: [20, 6], t: [6, 6], b: [4, 4] },
} as const;
