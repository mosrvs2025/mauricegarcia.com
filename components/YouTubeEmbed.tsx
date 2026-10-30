"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Click-to-load YouTube player. Nothing is requested from YouTube until the visitor presses play,
 * and then only from the privacy-enhanced youtube-nocookie.com domain. No thumbnail is fetched either.
 */
export function YouTubeEmbed({ id, title, slug }: { id: string; title: string; slug: string }) {
  const [on, setOn] = useState(false);
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  return (
    <div className="j-video">
      {on ? (
        <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      ) : (
        <button type="button" onClick={() => { track("demo_visit", { lesson: slug }); setOn(true); }} aria-label={`Play video: ${title}`}>
          <span className="j-video-play" aria-hidden="true">▶</span><span className="j-video-title">{title}</span><span className="j-video-note">Loads from YouTube when you press play</span>
        </button>
      )}
    </div>
  );
}
