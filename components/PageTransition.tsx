"use client";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { animatesTo, trackForUrl } from "@/lib/motion";

const COVER_MS = 220;   // curtain rises
const MIN_HOLD_MS = 40; // never lift before the spinner has been seen
const REVEAL_MS = 240;  // curtain lifts
const STALL_MS = 1800;  // navigation cancelled or very slow: lift anyway, never leave the visitor behind a curtain

/**
 * A short curtain on internal navigation (about half a second end to end). It rises when a same-origin link is
 * clicked and lifts once the new route has rendered, so the page swap happens behind it. Destinations in a
 * portfolio track (Experiences, Products, Labs, including project pages) wear that track's colour; every other
 * destination uses the active skin's accent. It never blocks input (pointer-events:none) and plain/back-forward
 * navigations simply skip it.
 */
function Curtain({ projectTracks }: { projectTracks: Record<string, string> }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const key = `${pathname}?${search}`;
  const el = useRef<HTMLDivElement>(null);
  const tracks = useRef(projectTracks);
  tracks.current = projectTracks;
  const s = useRef({ active: false, since: 0, timer: 0, stall: 0 });

  const lift = () => {
    const node = el.current; const st = s.current;
    window.clearTimeout(st.timer); window.clearTimeout(st.stall);
    if (!st.active || !node) return;
    st.active = false;
    node.dataset.s = "reveal";
    st.timer = window.setTimeout(() => { node.dataset.s = "idle"; }, REVEAL_MS + 60);
  };

  useEffect(() => {
    const node = el.current; const st = s.current;
    if (!node) return;
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      let url: URL;
      try { url = new URL(a.href, location.href); } catch { return; }
      if (!animatesTo(url, location)) return;
      window.clearTimeout(st.timer); window.clearTimeout(st.stall);
      node.dataset.track = trackForUrl(url, tracks.current) ?? "";
      node.dataset.s = "idle"; void node.offsetWidth; // restart from the bottom edge even mid-animation
      node.dataset.s = "cover";
      st.active = true; st.since = performance.now();
      st.stall = window.setTimeout(lift, STALL_MS);
    };
    // A page restored from the back/forward cache must not come back behind a frozen curtain.
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) { st.active = false; node.dataset.s = "idle"; } };
    document.addEventListener("click", onClick);
    window.addEventListener("pageshow", onShow);
    return () => { document.removeEventListener("click", onClick); window.removeEventListener("pageshow", onShow); window.clearTimeout(st.timer); window.clearTimeout(st.stall); };
  }, []);

  // The route (path or query) changed and rendered: lift once the cover has had time to be seen.
  useEffect(() => {
    const st = s.current;
    if (!st.active) return;
    window.clearTimeout(st.stall);
    const wait = Math.max(0, COVER_MS + MIN_HOLD_MS - (performance.now() - st.since));
    st.timer = window.setTimeout(lift, wait);
  }, [key]);

  return <div id="mg-pt" ref={el} data-s="idle" aria-hidden="true"><span>✳</span></div>;
}

export function PageTransition({ projectTracks }: { projectTracks: Record<string, string> }) {
  return <Suspense fallback={null}><Curtain projectTracks={projectTracks} /></Suspense>;
}
