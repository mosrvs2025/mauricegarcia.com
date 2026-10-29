"use client";
import { useEffect } from "react";
import { track, type TrackEvent } from "@/lib/analytics";

/** One delegated listener: any element with data-track="event" reports it, with data-track-* as parameters. */
export function ActionTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      const { track: event, ...rest } = el.dataset;
      const params: Record<string, string> = {};
      for (const [k, v] of Object.entries(rest)) if (k.startsWith("track") && v) params[k.slice(5).replace(/^./, (c) => c.toLowerCase())] = v;
      track(event as TrackEvent, params);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
