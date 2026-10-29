"use client";
import { track } from "@/lib/analytics";

/** The site's one small interactive signature: open a random playable demo. It only ever picks verified demo links. */
export function SurpriseMe({ demos }: { demos: { title: string; url: string; slug: string }[] }) {
  if (demos.length === 0) return null;
  return (
    <p className="j-surprise">
      <button type="button" onClick={() => {
        const pick = demos[Math.floor(Math.random() * demos.length)];
        track("surprise_me", { project: pick.slug });
        window.open(pick.url, "_blank", "noopener,noreferrer");
      }}>
        Surprise me with something to try
      </button>
      <span className="j-muted" style={{ display: "block", fontSize: ".8rem", marginTop: 8 }}>Opens a live demo in a new tab.</span>
    </p>
  );
}
