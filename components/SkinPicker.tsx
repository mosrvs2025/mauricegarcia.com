"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";
import { LEGACY_PREFIXES, SITE_SKINS, STORAGE_KEY, type SkinKey } from "@/lib/skin";

function read(): SkinKey {
  try { const s = localStorage.getItem(STORAGE_KEY); return SITE_SKINS.some((k) => k.id === s) ? (s as SkinKey) : "workshop"; } catch { return "workshop"; }
}

/** Lets a visitor flip the real site between design directions. Remembered per browser; works without JavaScript as the default look. */
export function SkinPicker({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const legacy = LEGACY_PREFIXES.test(pathname);
  const [skin, setSkin] = useState<SkinKey>("workshop");
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { setSkin(read()); }, []);
  // Older pages have their own styles; keep them on the default look, and restore the choice when leaving them.
  useEffect(() => {
    const el = document.documentElement;
    const s = read();
    if (legacy || s === "workshop") el.removeAttribute("data-skin"); else el.setAttribute("data-skin", s);
    window.dispatchEvent(new Event("mg-skin"));
  }, [legacy, pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    const onDown = (e: MouseEvent) => { if (!(e.target as Element).closest(".j-skin")) setOpen(false); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [open]);
  if (legacy) return null;
  const choose = (id: SkinKey) => {
    setSkin(id); setOpen(false);
    try { if (id === "workshop") localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, id); } catch { /* private mode: still applies for this page */ }
    if (id === "workshop") document.documentElement.removeAttribute("data-skin"); else document.documentElement.setAttribute("data-skin", id);
    window.dispatchEvent(new Event("mg-skin"));
    track("style_switch", { style: id });
  };
  const current = SITE_SKINS.find((s) => s.id === skin)!;
  return (
    <div className={`j-skin${mobile ? " j-skin-mobile" : ""}`}>
      <button ref={btn} type="button" aria-expanded={open} aria-controls={mobile ? "skin-menu-m" : "skin-menu"} onClick={() => setOpen(!open)}>
        <span aria-hidden="true">◐</span> <span className="j-skin-label">Style: {current.name}</span><span className="j-skin-short">Style</span>
      </button>
      {open && (
        <ul className="j-skin-menu" id={mobile ? "skin-menu-m" : "skin-menu"} role="radiogroup" aria-label="Site style">
          {SITE_SKINS.map((s) => (
            <li key={s.id}>
              <button type="button" role="radio" aria-checked={s.id === skin} onClick={() => choose(s.id)}>
                <span className="sw" aria-hidden="true">{s.swatch.map((c) => <i key={c} style={{ background: c }} />)}</span>
                <strong>{s.name}</strong><small>{s.note}</small>
              </button>
            </li>
          ))}
          <li className="j-skin-more"><a href="/lab">See full-page design demos →</a></li>
        </ul>
      )}
    </div>
  );
}
