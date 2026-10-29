import { cookies } from "next/headers";
import { authConfig, COOKIE, verifySession } from "./auth";
import { configuredStore } from "./store";

/** Server-side gate for studio pages and API routes. */
export async function requireOwner(): Promise<{ ok: true } | { ok: false; reason: string; configured: boolean }> {
  const cfg = authConfig();
  if (!cfg.ok) return { ok: false, reason: cfg.reason, configured: false };
  const jar = await cookies();
  return verifySession(jar.get(COOKIE)?.value, cfg.secret) ? { ok: true } : { ok: false, reason: "Not signed in.", configured: true };
}

export const studioStore = () => configuredStore();
