/**
 * Minimal, aggregate-only measurement of meaningful actions. No names, emails or
 * message text are ever sent. Respects Do Not Track and Global Privacy Control.
 */
export type TrackEvent = "demo_visit" | "source_click" | "project_to_contact" | "connect_intent" | "connect_submit" | "feed_click" | "post_read" | "surprise_me";

export function track(event: TrackEvent, params: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  gtag?.("event", event, params);
}
