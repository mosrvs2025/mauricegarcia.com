import crypto from "node:crypto";

/**
 * Single-owner session auth. The passphrase and signing secret are server
 * environment variables. The session is an HMAC-signed, expiring, HttpOnly,
 * SameSite=Strict cookie, so no credential or GitHub token reaches the browser.
 */
export const COOKIE = "mg_studio";
const TTL_MS = 12 * 3600_000;

const sha = (s: string) => crypto.createHash("sha256").update(s).digest();

export type AuthConfig = { ok: true; passphrase: string; secret: string } | { ok: false; reason: string };

export function authConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const passphrase = env.STUDIO_PASSPHRASE ?? ""; const secret = env.STUDIO_SESSION_SECRET ?? "";
  if (passphrase.length < 12) return { ok: false, reason: "STUDIO_PASSPHRASE is missing or shorter than 12 characters." };
  if (secret.length < 32) return { ok: false, reason: "STUDIO_SESSION_SECRET is missing or shorter than 32 characters." };
  return { ok: true, passphrase, secret };
}

export function checkPassphrase(input: string, expected: string): boolean {
  return crypto.timingSafeEqual(sha(input), sha(expected));
}

const sign = (payload: string, secret: string) => crypto.createHmac("sha256", secret).update(payload).digest("base64url");

export function createSession(secret: string, now = Date.now()): string {
  const exp = String(now + TTL_MS);
  return `${exp}.${sign(exp, secret)}`;
}

export function verifySession(cookie: string | undefined, secret: string, now = Date.now()): boolean {
  if (!cookie) return false;
  const [exp, mac] = cookie.split(".");
  if (!exp || !mac || !/^\d+$/.test(exp) || Number(exp) < now) return false;
  const expected = sign(exp, secret);
  return mac.length === expected.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
}

export const cookieOptions = (production: boolean) => ({ httpOnly: true, sameSite: "strict" as const, secure: production, path: "/", maxAge: TTL_MS / 1000 });

/** Best-effort login throttle (per server instance). Slows guessing; the passphrase length is the real defence. */
const attempts = new Map<string, { n: number; reset: number }>();
export function throttle(key: string, now = Date.now(), limit = 6, windowMs = 15 * 60_000): boolean {
  const a = attempts.get(key);
  if (!a || a.reset < now) { attempts.set(key, { n: 1, reset: now + windowMs }); return true; }
  a.n++; return a.n <= limit;
}
export function resetThrottle() { attempts.clear(); }
/** A correct passphrase clears the counter, so only failed guesses are held against the client. */
export function clearThrottle(key: string) { attempts.delete(key); }

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false; // state-changing studio calls must come from the page itself
  try { return new URL(origin).origin === new URL(req.url).origin; } catch { return false; }
}
