"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { DEFAULT_SKIN, LEGACY_PREFIXES, LEGACY_SKIN, STORAGE_KEY, isSkin, kindOf, skinMeta, type SkinKey } from "@/lib/skin";

/** The remembered choice, or null when there is none (or storage is blocked, in which case a choice only lasts for the page). */
export function readSavedSkin(): SkinKey | null {
  try { const s = localStorage.getItem(STORAGE_KEY); return isSkin(s) ? s : null; } catch { return null; }
}

/** What the page is actually showing right now (the boot script has already set it). */
export function activeSkin(): SkinKey {
  const v = document.documentElement.getAttribute("data-skin");
  return isSkin(v) ? v : DEFAULT_SKIN;
}

const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Writes data-skin and the browser theme colour, and tells canvases/listeners (HeroField, the page transition) to re-read their colours. */
export function setSkinAttribute(id: SkinKey) {
  const el = document.documentElement;
  if (el.getAttribute("data-skin") !== id) el.setAttribute("data-skin", id);
  el.setAttribute("data-kind", kindOf(id));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", skinMeta(id).themeColor);
  window.dispatchEvent(new Event("mg-skin"));
}

/**
 * Loads the fonts an identity needs before it appears, so the cross-fade never ends in a reflow. The faces of the
 * non-default identities are not preloaded (that is how only the active identity's fonts cost much); this fetches them
 * on demand, capped so a slow network can never delay the switch by more than a moment.
 */
async function warmFonts(id: SkinKey) {
  if (!document.fonts) return;
  const loads = skinMeta(id).fonts.map(async (v) => {
    const probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = `position:absolute;left:-9999px;opacity:0;pointer-events:none;font-family:var(${v})`;
    document.body.appendChild(probe);
    const family = getComputedStyle(probe).fontFamily; probe.remove();
    // A failed or blocked font request must never stop the switch: the skin still applies, with its fallback faces.
    await Promise.all([document.fonts.load(`400 1em ${family}`, "Aa"), document.fonts.load(`700 1em ${family}`, "Aa")]).catch(() => undefined);
  });
  await Promise.race([Promise.all(loads).catch(() => undefined), new Promise((r) => setTimeout(r, 450))]);
}

type VT = { startViewTransition?: (cb: () => void) => unknown };

/**
 * Switches identity. A short cross-fade through the View Transitions API where the browser has it (about 0.25s),
 * an instant switch everywhere else and whenever the visitor prefers reduced motion. The choice is remembered unless
 * the page is a legacy route, which keeps the classic look.
 */
export async function applySkin(id: SkinKey, opts: { remember?: boolean } = {}) {
  if (opts.remember !== false) { try { localStorage.setItem(STORAGE_KEY, id); } catch { /* private mode: still applies to this page */ } }
  if (LEGACY_PREFIXES.test(location.pathname)) return; // handled by the caller: those pages keep their own look
  try { await warmFonts(id); } catch { /* fonts are a nicety, never a blocker */ }
  const vt = document as unknown as VT;
  if (!prefersReducedMotion() && typeof vt.startViewTransition === "function") vt.startViewTransition(() => setSkinAttribute(id));
  else setSkinAttribute(id);
  track("style_switch", { style: id });
}

/** Applies the right skin for the current route: legacy pages always show the classic look, everything else the remembered choice. */
export function syncSkinToRoute(pathname: string) {
  if (LEGACY_PREFIXES.test(pathname)) return setSkinAttribute(LEGACY_SKIN);
  const saved = readSavedSkin();
  // No saved choice: keep a skin this page was opened with (?skin= with blocked storage), but never carry the classic look over from a legacy page.
  const shown = activeSkin();
  setSkinAttribute(saved ?? (shown !== LEGACY_SKIN ? shown : DEFAULT_SKIN));
}

/** The skin choice for UI (switcher state). Re-reads whenever any control changes the page's skin. */
export function useSkin(): SkinKey {
  const [skin, setSkin] = useState<SkinKey>(DEFAULT_SKIN);
  useEffect(() => {
    const read = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* blocked */ }
      // Storage blocked: fall back to what this page shows (legacy pages show the classic look whatever was chosen).
      setSkin(isSkin(saved) ? saved : LEGACY_PREFIXES.test(location.pathname) ? DEFAULT_SKIN : activeSkin());
    };
    read();
    window.addEventListener("mg-skin", read); window.addEventListener("storage", read);
    return () => { window.removeEventListener("mg-skin", read); window.removeEventListener("storage", read); };
  }, []);
  return skin;
}
