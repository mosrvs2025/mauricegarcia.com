import { NextResponse } from "next/server";
import { authConfig, checkPassphrase, COOKIE, cookieOptions, clearThrottle, createSession, sameOrigin, throttle } from "@/lib/studio/auth";

export async function POST(req: Request) {
  const cfg = authConfig();
  if (!cfg.ok) return NextResponse.json({ error: `The studio is not configured: ${cfg.reason}` }, { status: 503 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!throttle(ip)) return NextResponse.json({ error: "Too many attempts. Wait a few minutes." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.passphrase !== "string" || !checkPassphrase(body.passphrase, cfg.passphrase)) return NextResponse.json({ error: "That passphrase didn't work." }, { status: 401 });
  clearThrottle(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, createSession(cfg.secret), cookieOptions(process.env.NODE_ENV === "production"));
  return res;
}
