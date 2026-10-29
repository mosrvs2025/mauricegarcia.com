"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Shot = { src: string; alt: string; caption?: string; capturedAt?: string };
type Preview = { webm: string; mp4: string; poster: string };

/** Lead image (or muted loop), thumbnails, and a native <dialog> lightbox with arrow-key navigation. */
export function Gallery({ title, media, preview, captured }: { title: string; media: Shot[]; preview?: Preview; captured?: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  const [still, setStill] = useState(true);
  useEffect(() => { setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  const open = (n: number) => { setI(n); dlg.current?.showModal(); };
  const step = useCallback((d: number) => setI((n) => (n + d + media.length) % media.length), [media.length]);
  const onKey = (e: React.KeyboardEvent) => { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); };
  if (media.length === 0 && !preview) return null;
  const lead = media[0];
  return (
    <section className="j-gallery" aria-label={`${title} screenshots`}>
      <figure className="j-figure">
        {preview && !still ? (
          <video className="j-gallery-video" muted loop playsInline autoPlay preload="metadata" poster={preview.poster} aria-label={`${title}: a few seconds recorded from the live site`}>
            <source src={preview.webm} type="video/webm" /><source src={preview.mp4} type="video/mp4" />
          </video>
        ) : lead ? (
          <button type="button" className="j-shot-btn" onClick={() => open(0)} aria-label={`Enlarge: ${lead.alt}`}>
            <Image src={lead.src} alt={lead.alt} width={1280} height={720} sizes="(max-width:1280px) 100vw, 1200px" priority style={{ width: "100%", height: "auto" }} />
          </button>
        ) : null}
        <figcaption>{preview && !still ? "A few seconds recorded from the hosted build." : lead?.caption}{captured ? ` Captured ${captured}.` : ""}</figcaption>
      </figure>
      {media.length > 1 || (preview && media.length > 0) ? (
        <ul className="j-thumbs">
          {media.map((m, n) => (
            <li key={m.src}><button type="button" onClick={() => open(n)} aria-label={`Open screenshot ${n + 1} of ${media.length}: ${m.alt}`}>
              <Image src={m.src} alt="" width={320} height={180} sizes="200px" loading="lazy" />
            </button></li>
          ))}
        </ul>
      ) : null}
      <dialog ref={dlg} className="j-lightbox" onKeyDown={onKey} onClick={(e) => { if (e.target === dlg.current) dlg.current?.close(); }} aria-label={`${title} screenshots`}>
        {media[i] && (
          <figure>
            <Image src={media[i].src} alt={media[i].alt} width={1280} height={720} sizes="100vw" style={{ width: "100%", height: "auto" }} />
            <figcaption>{media[i].caption ?? media[i].alt} <span className="j-muted">({i + 1} / {media.length})</span></figcaption>
          </figure>
        )}
        <div className="j-lightbox-nav">
          {media.length > 1 && <button type="button" className="btn btn-ghost" onClick={() => step(-1)} aria-label="Previous screenshot">←</button>}
          <button type="button" className="btn btn-fill" onClick={() => dlg.current?.close()} autoFocus>Close</button>
          {media.length > 1 && <button type="button" className="btn btn-ghost" onClick={() => step(1)} aria-label="Next screenshot">→</button>}
        </div>
      </dialog>
    </section>
  );
}
