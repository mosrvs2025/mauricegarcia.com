"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { applySkin, syncSkinToRoute, useSkin } from "@/lib/skin-client";
import { CLASSIC_SKINS, IDENTITY_SKINS, LEGACY_PREFIXES, STORAGE_KEY, skinMeta, type SkinKey } from "@/lib/skin";

export const IDENTITY_SHORTCUT_LABEL = "Alt+Shift+S";
const OPEN_EVENT = "mg-identity-open";

/** Chooses an identity. Legacy pages (shop, studio, lab and friends) keep their own look, so there the choice is saved and the visitor is taken home to see it. */
function pick(id: SkinKey, done?: () => void) {
  if (LEGACY_PREFIXES.test(location.pathname)) {
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* blocked: the link below still carries the choice */ }
    location.assign(`/?skin=${id}`);
    return;
  }
  done?.();
  void applySkin(id);
}

/** Header-level plumbing: applies the right skin when the route changes, and listens for the keyboard shortcut. Mounted once, always. */
export function SkinRuntime() {
  const pathname = usePathname();
  useEffect(() => { syncSkinToRoute(pathname); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.altKey && e.shiftKey && e.code === "KeyS") || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      window.dispatchEvent(new Event(OPEN_EVENT));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return null;
}

type Radio = { id: SkinKey; name: string; note: string; swatch: readonly string[]; specimen: string; fonts: readonly string[] };

/** The three identities as large previews: each card is set in its own display face, so opening the menu also fetches those fonts. */
function IdentityCards({ skin, onPick }: { skin: SkinKey; onPick: (id: SkinKey) => void }) {
  return (
    <ul className="j-id-list" role="radiogroup" aria-label="Site identity">
      {(IDENTITY_SKINS as readonly Radio[]).map((s, i) => (
        <li key={s.id}>
          <button type="button" role="radio" aria-checked={s.id === skin} className="j-id" data-id={s.id} onClick={() => onPick(s.id)}>
            <span className="j-id-prev" aria-hidden="true" style={{ background: s.swatch[0], color: s.swatch[1], fontFamily: `var(${s.fonts[0]}), system-ui, sans-serif` }}>
              <b>{s.specimen}</b>
              <i style={{ background: s.swatch[2] }} />
            </span>
            <span className="j-id-text"><strong>{s.name}</strong><small>{s.note}</small></span>
            <kbd aria-hidden="true">{i + 1}</kbd>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ClassicSkins({ skin, onPick }: { skin: SkinKey; onPick: (id: SkinKey) => void }) {
  return (
    <ul className="j-more-list" role="radiogroup" aria-label="More skins">
      {(CLASSIC_SKINS as readonly Radio[]).map((s) => (
        <li key={s.id}>
          <button type="button" role="radio" aria-checked={s.id === skin} onClick={() => onPick(s.id)}>
            <span className="sw" aria-hidden="true">{s.swatch.map((c) => <i key={c} style={{ background: c }} />)}</span>
            <strong>{s.name}</strong><small>{s.note}</small>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * The identity switcher: Softworks, Mercury and Parallax first (ids open-case, rogue-instrument, unauthorized-manual), "More skins" for the older ones.
 * Reachable from the header (desktop and the mobile menu) and the footer on every page, plus Alt+Shift+S, and 1 to 3 while open.
 * Remembered per browser; also shareable as ?skin=.
 */
export function SkinPicker({ mobile = false }: { mobile?: boolean }) {
  const skin = useSkin();
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mobile) return;
    const show = () => { if (btn.current && btn.current.offsetParent !== null) { setOpen(true); requestAnimationFrame(() => menu.current?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus()); } };
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, [mobile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); btn.current?.focus(); return; }
      const n = Number(e.key);
      if (n >= 1 && n <= IDENTITY_SKINS.length && !e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); pick(IDENTITY_SKINS[n - 1].id, () => setOpen(false)); }
    };
    const onDown = (e: MouseEvent) => { if (!(e.target as Element).closest(".j-skin")) setOpen(false); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [open]);

  const current = skinMeta(skin);
  const menuId = mobile ? "skin-menu-m" : "skin-menu";
  return (
    <div className={`j-skin${mobile ? " j-skin-mobile" : ""}`}>
      <button ref={btn} type="button" aria-expanded={open} aria-controls={menuId} aria-keyshortcuts={mobile ? undefined : "Alt+Shift+S"} onClick={() => setOpen(!open)} data-track="identity_menu">
        <span className="j-skin-dots" aria-hidden="true">{current.swatch.map((c) => <i key={c} style={{ background: c }} />)}</span>
        <span className="j-skin-label">Identity: {current.name}</span><span className="j-skin-short">Identity</span>
      </button>
      {open && (
        <div className="j-skin-menu" id={menuId} ref={menu} role="group" aria-label="Choose a site identity">
          <p className="j-skin-head"><span>Site identity</span>{!mobile && <span className="j-skin-kbd"><kbd>{IDENTITY_SHORTCUT_LABEL}</kbd> to open · <kbd>1</kbd>–<kbd>3</kbd> to pick</span>}</p>
          <IdentityCards skin={skin} onPick={(id) => pick(id, () => setOpen(false))} />
          <button type="button" className="j-more-toggle" aria-expanded={more} aria-controls={`${menuId}-more`} onClick={() => setMore(!more)}>
            More skins ({CLASSIC_SKINS.length}) <span aria-hidden="true">{more ? "−" : "+"}</span>
          </button>
          {more && <div id={`${menuId}-more`}><ClassicSkins skin={skin} onPick={(id) => pick(id, () => setOpen(false))} /></div>}
          <p className="j-skin-more"><a href="/lab">See full-page design demos →</a></p>
          {LEGACY_PREFIXES.test(typeof location === "undefined" ? "" : location.pathname) && <p className="j-skin-note">This page keeps its own look. Choosing one takes you home in that identity.</p>}
        </div>
      )}
    </div>
  );
}

/** A quiet always-visible row for the footer: the three identities, and the older skins under a disclosure. Works on every page. */
export function FooterIdentity() {
  const skin = useSkin();
  const [more, setMore] = useState(false);
  return (
    <div className="j-foot-id" role="group" aria-label="Site identity">
      <p className="eyebrow">Identity <span className="j-muted">· or press {IDENTITY_SHORTCUT_LABEL}</span></p>
      <div className="j-foot-id-row" role="radiogroup" aria-label="Choose an identity">
        {(IDENTITY_SKINS as readonly Radio[]).map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={s.id === skin} data-id={s.id} onClick={() => pick(s.id)}>
            <span className="j-skin-dots" aria-hidden="true">{s.swatch.map((c) => <i key={c} style={{ background: c }} />)}</span>{s.name}
          </button>
        ))}
        <button type="button" className="j-foot-more" aria-expanded={more} onClick={() => setMore(!more)}>More skins ({CLASSIC_SKINS.length}) <span aria-hidden="true">{more ? "−" : "+"}</span></button>
      </div>
      {more && <ClassicSkins skin={skin} onPick={(id) => pick(id)} />}
    </div>
  );
}
