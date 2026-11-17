/**
 * Realtime configuration. Both values are public by design (Supabase's anon/publishable key only grants what the
 * project's policies allow; broadcast on a public channel needs no tables). Without them the playground still
 * works as a solo toy: weapons run locally, nobody else is shown.
 * Each variable is referenced literally so Next can inline it at build time.
 */
export type PlayConfig = { url: string; key: string };

export function readConfig(env: { url?: string; key?: string; off?: string } = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  off: process.env.NEXT_PUBLIC_PLAYGROUND,
}): { enabled: boolean; realtime: PlayConfig | null } {
  if ((env.off || "").trim().toLowerCase() === "off") return { enabled: false, realtime: null };
  const url = (env.url || "").trim().replace(/\/+$/, "");
  const key = (env.key || "").trim();
  const ok = (/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(url) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url)) && key.length > 20;
  return { enabled: true, realtime: ok ? { url, key } : null };
}
