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
 * Intro timeline (seconds): a black hole fades in at centre and swirls 0–1.2, then expands and swallows the screen
 * 1.2–1.9 (a growing void circle), the "mg" wordmark irises out of it 1.65–2.2, hold to 2.4, then three bands
 * retract upward 0.72s each, 0.14s apart, finishing at 3.4s. Reduced motion: a static mark that fades in 0.3s.
 *
 * Palette comes from the active skin's own variables (--j-bg, --j-accent, --j-text, --j-surface), set before
 * first paint by SKIN_BOOT_SCRIPT, so each skin gets its own intro. Workshop is #12100D with the
 * brand rust #ff6535, and a rust-to-gold disk (--b to --hot; other skins derive --hot from their accent). Band a is the
 * boot colour and carries the black hole and wordmark; b and c are revealed as it lifts.
 * Bands must be opaque (never the translucent Glass --j-surface), or the page would show through.
 */
export const INTRO_CSS = `
#mg-intro{display:none}
html.mg-intro-on{overflow:hidden}
html.mg-intro-on #mg-intro{display:block;position:fixed;inset:0;z-index:2147483000;overscroll-behavior:contain;touch-action:none;animation:mgi-failsafe 0s ${INTRO_FAILSAFE_MS / 1000}s forwards;--s:clamp(150px,28vmin,240px);--a:var(--j-bg,#12100D);--b:var(--j-accent,#ff6535);--c:color-mix(in srgb,var(--b) 24%,var(--a));--ink:var(--j-text,#f3ede3);--hot:color-mix(in srgb,var(--b) 45%,#fff);--void:color-mix(in srgb,var(--a) 10%,#000);--wm:#f3ede3}
html[data-skin="workshop"] #mg-intro{--a:#12100D;--b:#ff6535;--hot:#ffc857;--ink:#f3ede3}
html[data-skin="open-case"] #mg-intro{--a:#1B2B3A;--b:#155E8A;--c:#E8EEF2;--hot:#D0E4F1;--ink:#E8EEF2;--wm:#E8EEF2;--void:#0E1821}
html[data-skin="rogue-instrument"] #mg-intro{--a:#090D15;--b:#72E4FF;--c:#172233;--hot:#FF5C9B;--ink:#F8FAFF;--wm:#F8FAFF;--void:#030508}
html[data-skin="unauthorized-manual"] #mg-intro{--a:#0B1423;--b:#9EF3DC;--c:#142A3C;--hot:#2CB4B1;--ink:#F8FBFF;--wm:#F8FBFF;--void:#040911}
html[data-skin="paper"] #mg-intro{--c:var(--j-text)}
html[data-skin="pop"] #mg-intro{--c:var(--j-text)}
html[data-skin="swiss"] #mg-intro{--c:var(--j-text)}
html[data-skin="terminal"] #mg-intro{--wm:var(--j-text)}
html[data-skin="arcade"] #mg-intro{--c:#2ff3ff;--hot:#2ff3ff;--wm:var(--j-text)}
html[data-skin="glass"] #mg-intro{--c:color-mix(in srgb,var(--b) 32%,var(--a));--hot:#2fd6a1;--wm:var(--j-text)}
#mg-intro .b{position:absolute;inset:0;clip-path:inset(0 0 0 0);will-change:clip-path;animation:mgi-up .72s cubic-bezier(.76,0,.18,1) both}
#mg-intro .b3{background:var(--c);animation-delay:2.68s}
#mg-intro .b2{background:var(--b);animation-delay:2.54s}
#mg-intro .b1{background:var(--a);animation-delay:2.4s;display:grid;place-items:center}
#mg-intro .swallow{position:absolute;inset:0;background:var(--void);clip-path:circle(calc(var(--s) * .17) at 50% 50%);animation:mgi-swallow .7s cubic-bezier(.7,0,.95,.45) 1.2s both}
#mg-intro .bh{grid-area:1/1;z-index:2;animation:mgi-bh-in .35s ease-out backwards,mgi-bh-out .7s cubic-bezier(.7,0,.95,.45) 1.2s forwards}
#mg-intro .word{grid-area:1/1;z-index:3;font-family:var(--j-font-display,var(--font-display,Georgia,serif));font-weight:800;font-size:clamp(4.5rem,17vw,9.5rem);letter-spacing:-.11em;line-height:1;color:var(--wm);clip-path:circle(0% at 50% 50%);animation:mgi-iris .55s cubic-bezier(.6,0,.2,1) 1.65s forwards}
#mg-intro .word b{display:inline-block;font-weight:inherit;font-size:.42em;vertical-align:top;margin-left:.14em;color:var(--b);animation:mgi-settle 1.1s cubic-bezier(.2,.7,.2,1) 1.7s backwards}
html[data-skin="terminal"] #mg-intro .word,html[data-skin="arcade"] #mg-intro .word{letter-spacing:-.04em}
html[data-kind="identity"] #mg-intro .word{font-weight:var(--j-display-weight,800);font-stretch:var(--j-stretch,100%);letter-spacing:-.05em;text-transform:lowercase}
html[data-kind="identity"] #mg-intro .word b{font-size:inherit;display:inline-block;width:.2em;height:.2em;margin-left:.07em;vertical-align:baseline;border-radius:0;background:var(--b);color:transparent;overflow:hidden;animation:none}
html[data-skin="open-case"] #mg-intro .word b{border-radius:50%}
html.mg-intro-skip #mg-intro{animation:mgi-skip .25s ease forwards}
@keyframes mgi-up{from{clip-path:inset(0 0 0 0)}to{clip-path:inset(0 0 100% 0)}}
@keyframes mgi-bh-in{from{opacity:0;scale:.5}}
@keyframes mgi-bh-out{to{opacity:0;scale:1.9}}
@keyframes mgi-swallow{to{clip-path:circle(110% at 50% 50%)}}
@keyframes mgi-iris{to{clip-path:circle(120% at 50% 50%)}}
@keyframes mgi-settle{from{rotate:-300deg}}
@keyframes mgi-skip{to{opacity:0}}
@keyframes mgi-fade{to{opacity:0}}
@keyframes mgi-failsafe{to{visibility:hidden;pointer-events:none}}
@media (prefers-reduced-motion:reduce){
html.mg-intro-on #mg-intro .b2,html.mg-intro-on #mg-intro .b3,html.mg-intro-on #mg-intro .bh,html.mg-intro-on #mg-intro .swallow{display:none}
html.mg-intro-on #mg-intro .b1{animation:mgi-fade .3s ease .45s both!important;clip-path:none}
html.mg-intro-on #mg-intro .word{animation:none!important;clip-path:none;color:var(--ink)}
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

/** Every skin id the switcher offers must have an intro palette (its own override above, or the variable-driven default). Used by tests. */
export const INTRO_SKIN_IDS = SITE_SKINS.map((s) => s.id);
