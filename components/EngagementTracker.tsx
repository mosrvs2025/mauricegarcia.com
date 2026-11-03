"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { track } from "@/lib/analytics";

const DEPTHS = [25, 50, 75, 90];

/**
 * Aggregate page engagement: scroll depth milestones, engaged seconds per page,
 * outbound link clicks and Core Web Vitals. No identifiers, no form contents.
 */
export function EngagementTracker() {
  const path = usePathname() || "/";

  useReportWebVitals((m) => {
    track("web_vital", { metric: m.name, value: String(Math.round(m.name === "CLS" ? m.value * 1000 : m.value)), rating: (m as { rating?: string }).rating || "", page: path });
  });

  // Scroll depth + engaged time, reset per page.
  useEffect(() => {
    const hit = new Set<number>();
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = (window.scrollY / max) * 100;
      for (const d of DEPTHS) if (pct >= d && !hit.has(d)) { hit.add(d); track("scroll_depth", { percent: String(d), page: path }); }
    };
    let visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
    let total = 0;
    const onVis = () => {
      if (document.visibilityState === "visible") visibleSince = Date.now();
      else if (visibleSince) { total += Date.now() - visibleSince; visibleSince = 0; }
    };
    let sent = false;
    const flush = () => {
      if (sent) return; sent = true;
      if (visibleSince) total += Date.now() - visibleSince;
      const secs = Math.round(total / 1000);
      if (secs >= 5) track("engaged_time", { seconds: String(secs), page: path, transport_type: "beacon" });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [path]);

  // Outbound links not already tagged with data-track.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!a || a.closest("[data-track]")) return;
      let url: URL;
      try { url = new URL(a.href, location.href); } catch { return; }
      if (!/^https?:$/.test(url.protocol) || url.host === location.host) return;
      track("outbound_click", { domain: url.hostname.replace(/^www\./, ""), page: path });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [path]);

  return null;
}
