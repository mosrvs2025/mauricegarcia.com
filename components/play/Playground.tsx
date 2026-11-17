"use client";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { readConfig } from "@/lib/play/config";
import { identityFromId, randomId } from "@/lib/play/identity";
import type { WeaponId } from "@/lib/play/protocol";
import type { LinkStatus } from "@/lib/play/transport";
import { WEAPONS } from "@/lib/play/weapons";
import { LEGACY_PREFIXES } from "@/lib/skin";
import { MOTION_EXEMPT } from "@/lib/motion";

const CONFIG = readConfig();
const STORE = "mg-play";
const ID_KEY = "mg-play-id";
const ICONS: Record<WeaponId, string> = { blaster: "💥", bomb: "💣", laser: "⚡", hammer: "🔨" };
const ORDER: WeaponId[] = ["blaster", "bomb", "laser", "hammer"];

type StageHandle = import("@/lib/play/stage").Stage;

/**
 * Anonymous live playground: other visitors' cursors and taps, and a weapons mode that blasts the page with
 * canvas debris. The real page is never modified. Off by default for visitors who prefer reduced motion or have
 * Data Saver on, one click to turn off, and nothing loads until it is on and the page is idle.
 */
export function Playground() {
  const path = usePathname() || "/";
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [armed, setArmed] = useState(false);
  const [weapon, setWeapon] = useState<WeaponId>("blaster");
  const [peers, setPeers] = useState(1);
  const [status, setStatus] = useState<LinkStatus>("connecting");
  const [shots, setShots] = useState<{ n: number; w: WeaponId; ms: number }>({ n: 0, w: "blaster", ms: 0 });
  const [note, setNote] = useState("");
  const [id, setId] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<StageHandle | null>(null);
  const pathRef = useRef(path); pathRef.current = path;
  const toggle = useRef<HTMLButtonElement>(null);
  const hidden = MOTION_EXEMPT.test(path) || LEGACY_PREFIXES.test(path);
  const active = ready && enabled && !hidden && CONFIG.enabled;

  // First run: decide the default (off for reduced motion or Data Saver unless the visitor chose), then remember it.
  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(STORE); } catch { /* storage may be blocked */ }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saver = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setEnabled(stored === "on" || (stored !== "off" && !reduce && !saver));
    let sid = "";
    try { sid = sessionStorage.getItem(ID_KEY) || ""; } catch { /* ignore */ }
    if (!/^[a-z0-9]{8}$/.test(sid)) { sid = randomId(); try { sessionStorage.setItem(ID_KEY, sid); } catch { /* ignore */ } }
    setId(sid); setReady(true);
  }, []);

  const remember = (v: "on" | "off") => { try { localStorage.setItem(STORE, v); } catch { /* ignore */ } };

  // Start the canvas engine when the page is idle, so it never competes with first paint.
  useEffect(() => {
    if (!active || !id) return;
    let cancelled = false; let handle: StageHandle | null = null;
    const start = async () => {
      const cfg = CONFIG.realtime;
      const [{ createStage }, transport] = await Promise.all([
        import("@/lib/play/stage"),
        cfg ? import("@/lib/play/transport").then((m) => m.supabaseTransport(cfg)) : Promise.resolve(null),
      ]);
      if (cancelled || !canvas.current) return;
      handle = createStage({
        canvas: canvas.current, transport, id,
        reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        onPeers: setPeers, onStatus: setStatus,
        onFire: (w, ms) => setShots((s) => ({ n: s.n + 1, w, ms })),
      });
      stage.current = handle; handle.setPath(pathRef.current);
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
    const useIdle = typeof w.requestIdleCallback === "function";
    const t = useIdle ? w.requestIdleCallback!(() => void start(), { timeout: 2500 }) : window.setTimeout(() => void start(), 1200);
    return () => { cancelled = true; if (useIdle) w.cancelIdleCallback?.(t); else clearTimeout(t); handle?.destroy(); stage.current = null; setPeers(1); };
  }, [active, id]);

  useEffect(() => { const t = setTimeout(() => stage.current?.setPath(path), 250); return () => clearTimeout(t); }, [path]);
  useEffect(() => { stage.current?.setWeapon(armed && active ? weapon : null); }, [armed, weapon, active]);
  useEffect(() => { if (!active) setArmed(false); }, [active]);

  // Keyboard: Escape leaves weapons mode; 1 to 4 pick a weapon while armed.
  useEffect(() => {
    if (!armed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setArmed(false); setNote("Weapons mode off."); toggle.current?.focus(); return; }
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && (t as HTMLInputElement).type !== "radio") return;
      const w = ORDER.find((o) => WEAPONS[o].key === e.key);
      if (w) { setWeapon(w); setNote(`${WEAPONS[w].label} selected.`); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [armed]);

  const turnOn = useCallback(() => { setEnabled(true); remember("on"); setNote("Live playground on."); }, []);
  const turnOff = useCallback(() => { setEnabled(false); setArmed(false); remember("off"); setNote("Live playground off."); }, []);
  const arm = () => { const next = !armed; setArmed(next); setNote(next ? `Weapons mode on, ${WEAPONS[weapon].label}. Click or tap the page to fire. Escape to stop.` : "Weapons mode off."); };

  if (!ready || hidden || !CONFIG.enabled) return null;
  const me = id ? identityFromId(id) : null;
  const lonely = peers <= 1;
  const link = !CONFIG.realtime ? "solo" : status === "online" ? (lonely ? "just you" : `${peers} here`) : status === "connecting" ? "connecting" : "offline";

  return (
    <>
      {enabled && <canvas ref={canvas} className={`play-canvas${armed ? " is-armed" : ""}`} aria-hidden="true" data-play />}
      <div className="play-dock" data-play role="group" aria-label="Live playground">
        {!enabled ? (
          <button type="button" className="play-fab" onClick={turnOn} aria-label="Turn on the live playground: see other visitors and blast the page">
            <span aria-hidden="true">✦</span><span className="play-fab-text">Play</span>
          </button>
        ) : (
          <>
            {armed && (
              <fieldset className="play-picker">
                <legend className="play-sr">Weapon</legend>
                <p className="play-hint" aria-hidden="true">Click or tap the page to fire · Esc to stop</p>
                <div className="play-weapons">
                {ORDER.map((w) => (
                  <label key={w} className={`play-weapon${weapon === w ? " on" : ""}`} title={`${WEAPONS[w].blurb} (key ${WEAPONS[w].key})`}>
                    <input type="radio" name="play-weapon" value={w} checked={weapon === w} onChange={() => setWeapon(w)} />
                    <span className="play-wi" aria-hidden="true">{ICONS[w]}</span>
                    <span className="play-wl">{WEAPONS[w].label}</span>
                    {shots.n > 0 && shots.w === w && <i key={shots.n} className="play-cd" style={{ animationDuration: `${shots.ms}ms` }} aria-hidden="true" />}
                  </label>
                ))}
                </div>
              </fieldset>
            )}
            <div className="play-bar">
              <span className="play-who" title={me ? `You are ${me.name}. Anonymous and temporary.` : undefined}>
                <i className="play-dot" style={{ background: me?.color }} aria-hidden="true" />
                <span className="play-name">{me ? `${me.emoji} ${me.name}` : ""}</span>
                <span className="play-count"><span className="play-sep" aria-hidden="true"> · </span>{link}</span>
              </span>
              <button ref={toggle} type="button" className={`play-btn${armed ? " armed" : ""}`} aria-pressed={armed} onClick={arm}>
                <span aria-hidden="true">{armed ? ICONS[weapon] : "🎯"}</span> Weapons
              </button>
              <button type="button" className="play-btn play-off" onClick={turnOff} aria-label="Turn the live playground off">Off</button>
            </div>
          </>
        )}
        <p className="play-sr" role="status" aria-live="polite">{note}</p>
      </div>
    </>
  );
}
