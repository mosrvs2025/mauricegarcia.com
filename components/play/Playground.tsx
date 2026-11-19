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
const IN_KEY = "mg-play-in"; // sessionStorage: this tab chose to enter (a new visit starts out, and must opt in again)
const MIN_KEY = "mg-play-min"; // localStorage: the entry card was minimised (a UI preference, nothing identifying)
const ID_KEY = "mg-play-id";
const ICONS: Record<WeaponId, string> = { blaster: "💥", bomb: "💣", laser: "⚡", hammer: "🔨" };
const ORDER: WeaponId[] = ["blaster", "bomb", "laser", "hammer"];

type StageHandle = import("@/lib/play/stage").Stage;

/**
 * Anonymous live playground: other visitors' cursors and taps, and a weapons mode that blasts the page with
 * canvas debris. The real page is never modified.
 *
 * Opt-in: nothing loads and no connection is made until the visitor clicks "Enter the Playground", whose card
 * carries the privacy notice. Exit disconnects and goes back to the card. The canvas engine and the realtime
 * library are separate lazy chunks.
 */
export function Playground() {
  const path = usePathname() || "/";
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [min, setMin] = useState(false);
  const [armed, setArmed] = useState(false);
  const [weapon, setWeapon] = useState<WeaponId>("blaster");
  const [peers, setPeers] = useState(1);
  const [status, setStatus] = useState<LinkStatus>("connecting");
  const [paused, setPaused] = useState(false);
  const [shots, setShots] = useState<{ n: number; w: WeaponId; ms: number }>({ n: 0, w: "blaster", ms: 0 });
  const [note, setNote] = useState("");
  const [id, setId] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<StageHandle | null>(null);
  const pathRef = useRef(path); pathRef.current = path;
  const toggle = useRef<HTMLButtonElement>(null);
  const enterBtn = useRef<HTMLButtonElement>(null);
  const focusNext = useRef<"bar" | "entry" | null>(null);
  const hidden = MOTION_EXEMPT.test(path) || LEGACY_PREFIXES.test(path) || path.startsWith("/connect");
  const active = ready && entered && !hidden && CONFIG.enabled;

  useEffect(() => {
    try { setEntered(sessionStorage.getItem(IN_KEY) === "1"); const saved = localStorage.getItem(MIN_KEY);
      // The card is open by default on wide screens. On phones it starts as the small pill so it never sits over the hero, until the visitor opens it.
      setMin(saved === "1" || (saved === null && matchMedia("(max-width: 900px)").matches)); } catch { /* storage may be blocked */ }
    let sid = "";
    try { sid = sessionStorage.getItem(ID_KEY) || ""; } catch { /* ignore */ }
    if (!/^[a-z0-9]{8}$/.test(sid)) { sid = randomId(); try { sessionStorage.setItem(ID_KEY, sid); } catch { /* ignore */ } }
    setId(sid); setReady(true);
  }, []);

  // Nothing at all happens until the visitor has entered. Then the engine starts when the page is idle.
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
        saver: !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
        onPeers: setPeers, onStatus: setStatus, onPause: setPaused,
        onFire: (w, ms) => setShots((s) => ({ n: s.n + 1, w, ms })),
      });
      stage.current = handle; handle.setPath(pathRef.current);
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
    const useIdle = typeof w.requestIdleCallback === "function";
    const t = useIdle ? w.requestIdleCallback!(() => void start(), { timeout: 1500 }) : window.setTimeout(() => void start(), 600);
    return () => { cancelled = true; if (useIdle) w.cancelIdleCallback?.(t); else clearTimeout(t); handle?.destroy(); stage.current = null; setPeers(1); setStatus("connecting"); setPaused(false); };
  }, [active, id]);

  useEffect(() => { const t = setTimeout(() => stage.current?.setPath(path), 250); return () => clearTimeout(t); }, [path]);
  useEffect(() => { stage.current?.setWeapon(armed && active ? weapon : null); }, [armed, weapon, active]);
  useEffect(() => { if (!active) setArmed(false); }, [active]);
  useEffect(() => { // keep keyboard focus somewhere sensible when the controls swap
    if (focusNext.current === "bar") toggle.current?.focus(); else if (focusNext.current === "entry") enterBtn.current?.focus();
    focusNext.current = null;
  }, [entered]);

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

  const enter = useCallback(() => { setEntered(true); try { sessionStorage.setItem(IN_KEY, "1"); } catch { /* ignore */ } focusNext.current = "bar"; setNote("You are in the playground. Anonymous and temporary."); }, []);
  const exit = useCallback(() => { setEntered(false); setArmed(false); try { sessionStorage.removeItem(IN_KEY); } catch { /* ignore */ } focusNext.current = "entry"; setNote("Left the playground. Disconnected."); }, []);
  const minimise = (v: boolean) => { setMin(v); try { if (v) localStorage.setItem(MIN_KEY, "1"); else localStorage.setItem(MIN_KEY, "0"); } catch { /* ignore */ } };
  const arm = () => { const next = !armed; setArmed(next); setNote(next ? `Weapons mode on, ${WEAPONS[weapon].label}. Click or tap the page to fire. Escape to stop.` : "Weapons mode off."); };

  if (!ready || hidden || !CONFIG.enabled) return null;
  const me = id ? identityFromId(id) : null;
  const lonely = peers <= 1;
  const link = !CONFIG.realtime ? "solo" : paused ? "paused" : status === "online" ? (lonely ? "just you" : `${peers} here`) : status === "connecting" ? "connecting…" : status === "failed" ? "local only" : "reconnecting…";
  const privacy = CONFIG.realtime
    ? "Anonymous: a random animal name, no accounts, nothing stored. Live play uses Supabase Realtime, which sees your IP address while you are in."
    : "Runs on this device only. Nothing is sent anywhere.";

  return (
    <>
      {entered && <canvas ref={canvas} className={`play-canvas${armed ? " is-armed" : ""}`} aria-hidden="true" data-play />}
      <div className="play-dock" data-play role="group" aria-label="Playground">
        {!entered ? (
          min ? (
            <button type="button" className="play-fab" onClick={() => minimise(false)} aria-label="Show the Enter the Playground card">
              <span className="play-spark" aria-hidden="true">✦</span><span className="play-fab-text">Playground</span>
            </button>
          ) : (
            <div className="play-entry">
              <div className="play-entry-row">
                <button ref={enterBtn} type="button" className="play-enter" onClick={enter} aria-describedby="play-privacy">
                  <span className="play-spark" aria-hidden="true">✦</span> Enter the Playground
                </button>
                <button type="button" className="play-x" onClick={() => minimise(true)} aria-label="Minimise this card">×</button>
              </div>
              <p id="play-privacy" className="play-privacy">{privacy}</p>
            </div>
          )
        ) : (
          <>
            <div className="play-bar">
              <span className="play-who" title={me ? `You are ${me.name}. ${privacy}` : undefined}>
                <i className="play-dot" style={{ background: me?.color }} aria-hidden="true" />
                <span className="play-name">{me ? `${me.emoji} ${me.name}` : ""}</span>
                <span className="play-count"><span className="play-sep" aria-hidden="true"> · </span>{link}</span>
              </span>
              <button ref={toggle} type="button" className={`play-btn${armed ? " armed" : ""}`} aria-pressed={armed} onClick={arm}>
                <span aria-hidden="true">{armed ? ICONS[weapon] : "🎯"}</span> Weapons
              </button>
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
              <button type="button" className="play-btn play-off" onClick={exit} aria-label="Exit the playground and disconnect">Exit</button>
            </div>
          </>
        )}
        <p className="play-sr" role="status" aria-live="polite">{note}</p>
      </div>
    </>
  );
}
