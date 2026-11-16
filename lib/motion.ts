/**
 * Once-per-tab intro and track-coloured page transitions.
 *
 * No animation library is used: the intro is pure CSS keyframes painted from an inline <style> in <head>
 * (so nothing flashes before hydration) and a tiny inline script decides whether it plays. Page transitions
 * are one small client component. The bundle cost of the intro itself is zero.
 */
import { SITE_SKINS } from "./skin";

export const INTRO_KEY = "mg-intro-seen";
/** Hard stop in case the animation never reports it finished (the visitor must never be stuck behind it). */
export const INTRO_FAILSAFE_MS = 8000;
/** Paths that never get the intro or the curtain: private tools and API routes. */
export const MOTION_EXEMPT = /^\/(studio|api)(\/|$)/;

export type Track = "experiences" | "products" | "labs";
const TRACKS: readonly string[] = ["experiences", "products", "labs"];

/** Which portfolio track (if any) a destination belongs to, so the curtain can wear its colour. */
export function trackForUrl(url: URL, projectTracks: Record<string, string>): Track | null {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path === "/projects") {
    const t = url.searchParams.get("track");
    return t && TRACKS.includes(t) ? (t as Track) : null;
  }
  const m = path.match(/^\/projects\/([^/]+)$/);
  const t = m ? projectTracks[decodeURIComponent(m[1])] : undefined;
  return t && TRACKS.includes(t) ? (t as Track) : null;
}

/** Whether a same-origin link click should play a curtain (files and API routes are not page navigations). */
export function animatesTo(url: URL, from: Location | URL): boolean {
  if (url.origin !== from.origin) return false;
  if (url.pathname === from.pathname && url.search === from.search) return false; // same page or just a #hash
  if (MOTION_EXEMPT.test(url.pathname) || MOTION_EXEMPT.test(from.pathname)) return false;
  if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) return false; // feeds, PDFs, images: not a client navigation
  return true;
}

/**
 * Intro timeline (seconds): spinner 0–1.0, iris into the wordmark 1.0–1.65, hold to 2.15, then three bands
 * retract upward 0.72s each, 0.14s apart, finishing at 3.31s. Reduced motion: a static mark that fades in 0.3s.
 *
 * Palette comes from the active skin's own variables (--j-bg, --j-accent, --j-text, --j-surface), set before
 * first paint by SKIN_BOOT_SCRIPT, so each skin gets its own intro. Workshop (no data-skin) is #12100D with the
 * brand rust #ff6535. Band a is the boot colour and carries the logo; b and c are revealed as it lifts.
 * Bands must be opaque (never the translucent Glass --j-surface), or the page would show through.
 */
export const INTRO_CSS = `
#mg-intro{display:none}
html.mg-intro-on{overflow:hidden}
html.mg-intro-on #mg-intro{display:block;position:fixed;inset:0;z-index:2147483000;overscroll-behavior:contain;touch-action:none;animation:mgi-failsafe 0s ${INTRO_FAILSAFE_MS / 1000}s forwards;--a:var(--j-bg,#12100D);--b:var(--j-accent,#ff6535);--c:color-mix(in srgb,var(--b) 24%,var(--a));--ink:var(--j-text,#f3ede3);--star:var(--b)}
html:not([data-skin]) #mg-intro{--a:#12100D;--b:#ff6535;--star:#ff6535;--ink:#f3ede3}
html[data-skin="paper"] #mg-intro{--c:var(--j-text)}
html[data-skin="pop"] #mg-intro{--c:var(--j-text)}
html[data-skin="swiss"] #mg-intro{--c:var(--j-text)}
html[data-skin="arcade"] #mg-intro{--c:#2ff3ff}
html[data-skin="glass"] #mg-intro{--c:color-mix(in srgb,var(--b) 32%,var(--a))}
#mg-intro .b{position:absolute;inset:0;clip-path:inset(0 0 0 0);will-change:clip-path;animation:mgi-up .72s cubic-bezier(.76,0,.18,1) both}
#mg-intro .b3{background:var(--c);animation-delay:2.43s}
#mg-intro .b2{background:var(--b);animation-delay:2.29s}
#mg-intro .b1{background:var(--a);animation-delay:2.15s;display:grid;place-items:center}
#mg-intro .star{grid-area:1/1;font-size:clamp(2rem,6vw,2.75rem);line-height:1;color:var(--star);animation:mgi-in .3s ease-out backwards,mgi-spin 1.1s linear infinite,mgi-out .45s ease-in 1s forwards}
#mg-intro .word{grid-area:1/1;font-family:var(--j-font-display,var(--font-display,Georgia,serif));font-weight:800;font-size:clamp(4.5rem,17vw,9.5rem);letter-spacing:-.11em;line-height:1;color:var(--ink);clip-path:circle(0% at 50% 50%);animation:mgi-iris .65s cubic-bezier(.6,0,.2,1) 1s forwards}
#mg-intro .word b{display:inline-block;font-weight:inherit;font-size:.42em;vertical-align:top;margin-left:.14em;color:var(--star);animation:mgi-settle 1.1s cubic-bezier(.2,.7,.2,1) 1.05s backwards}
html[data-skin="terminal"] #mg-intro .word,html[data-skin="arcade"] #mg-intro .word{letter-spacing:-.04em}
html.mg-intro-skip #mg-intro{animation:mgi-skip .25s ease forwards}
@keyframes mgi-up{from{clip-path:inset(0 0 0 0)}to{clip-path:inset(0 0 100% 0)}}
@keyframes mgi-in{from{opacity:0;scale:.4}}
@keyframes mgi-spin{to{rotate:360deg}}
@keyframes mgi-out{to{opacity:0;scale:.3}}
@keyframes mgi-iris{to{clip-path:circle(120% at 50% 50%)}}
@keyframes mgi-settle{from{rotate:-300deg}}
@keyframes mgi-skip{to{opacity:0}}
@keyframes mgi-fade{to{opacity:0}}
@keyframes mgi-failsafe{to{visibility:hidden;pointer-events:none}}
@media (prefers-reduced-motion:reduce){
html.mg-intro-on #mg-intro .b2,html.mg-intro-on #mg-intro .b3{display:none}
html.mg-intro-on #mg-intro .b1{animation:mgi-fade .3s ease .45s both!important;clip-path:none}
html.mg-intro-on #mg-intro .star{display:none}
html.mg-intro-on #mg-intro .word{animation:none!important;clip-path:none}
html.mg-intro-on #mg-intro .word b{animation:none!important}
}
`.replace(/\n/g, "");

/**
 * Runs in <head> right after the skin boot script. Decides whether this tab has seen the intro, locks scroll
 * while it plays, and ends it when the last band finishes (or at the failsafe, whichever comes first).
 * `?intro=1` replays it; `?intro=0` suppresses it. Never throws: any failure simply means no intro.
 */
export const INTRO_BOOT_SCRIPT = `(function(){var d=document.documentElement;try{var q=location.search,f=/[?&]intro=1(&|$)/.test(q);if(window.top!==window||${MOTION_EXEMPT}.test(location.pathname)||/[?&]intro=0(&|$)/.test(q))return;if(!f&&sessionStorage.getItem("${INTRO_KEY}"))return;sessionStorage.setItem("${INTRO_KEY}","1")}catch(e){return}
var w=innerWidth-d.clientWidth;if(w>0)d.style.paddingRight=w+"px";d.classList.add("mg-intro-on");var done=0,t;
function end(){if(done)return;done=1;clearTimeout(t);d.classList.remove("mg-intro-on","mg-intro-skip");d.style.paddingRight="";document.removeEventListener("animationend",onA,true);document.removeEventListener("click",onS,true);document.removeEventListener("keydown",onK,true)}
function onA(e){if(e.animationName==="mgi-fade"||(e.animationName==="mgi-up"&&e.target.className.indexOf("b3")>-1))end()}
function skip(){if(done)return;d.classList.add("mg-intro-skip");setTimeout(end,260)}
function onS(e){if(e.target.closest&&e.target.closest("#mg-intro"))skip()}
function onK(e){if(e.key==="Escape")skip()}
document.addEventListener("animationend",onA,true);document.addEventListener("click",onS,true);document.addEventListener("keydown",onK,true);t=setTimeout(end,${INTRO_FAILSAFE_MS})})();`;

/** Every skin id the picker offers must have an intro palette (default tokens cover Workshop). Used by tests. */
export const INTRO_SKIN_IDS = SITE_SKINS.map((s) => s.id);
