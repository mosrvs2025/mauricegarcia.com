"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  title: string;
  image?: { src: string; alt: string };
  preview?: { webm: string; mp4: string; poster: string };
  sizes: string;
  priority?: boolean;
};

/**
 * A still image, plus an optional muted loop that only loads and plays when someone shows interest:
 * hover or keyboard focus on the card, or (on touch screens) when the card is mostly in view.
 * Under prefers-reduced-motion the loop never plays.
 */
export function PreviewMedia({ title, image, preview, sizes, priority }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    const card = el?.closest<HTMLElement>("[data-card]");
    if (!el || !card || !preview) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (still.matches) return;
    const start = () => setOn(true);
    const stop = () => setOn(false);
    card.addEventListener("pointerenter", start);
    card.addEventListener("pointerleave", stop);
    card.addEventListener("focusin", start);
    card.addEventListener("focusout", stop);
    let io: IntersectionObserver | undefined;
    if (window.matchMedia("(hover: none)").matches) {
      io = new IntersectionObserver(([e]) => setOn(e.intersectionRatio > 0.6), { threshold: [0, 0.6, 1] });
      io.observe(el);
    }
    return () => {
      card.removeEventListener("pointerenter", start);
      card.removeEventListener("pointerleave", stop);
      card.removeEventListener("focusin", start);
      card.removeEventListener("focusout", stop);
      io?.disconnect();
    };
  }, [preview]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (on) v.play().catch(() => {});
    else v.pause();
  }, [on]);

  const still = image ?? (preview ? { src: preview.poster, alt: `${title}, a frame from the hosted build` } : undefined);
  return (
    <div ref={wrap} className={`j-pm${on ? " is-on" : ""}`}>
      {still ? <Image src={still.src} alt={still.alt} fill sizes={sizes} priority={priority} loading={priority ? undefined : "lazy"} style={{ objectFit: "cover" }} /> : <span className="j-tile-letter" aria-hidden="true">{title.slice(0, 1)}</span>}
      {preview && on && (
        <video ref={video} className="j-pm-video" muted loop playsInline autoPlay preload="none" poster={preview.poster} aria-hidden="true" tabIndex={-1}>
          <source src={preview.webm} type="video/webm" />
          <source src={preview.mp4} type="video/mp4" />
        </video>
      )}
      {preview && <span className="j-pm-badge" aria-hidden="true">{on ? "● Live preview" : "▶ Preview"}</span>}
    </div>
  );
}
