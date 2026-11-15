import Image from "next/image";
import { site } from "@/lib/site";

type PortraitSize = "nav" | "hero";

/**
 * Instagram profile photo in a slow-spinning dusk ring.
 * The official public og:image is 150×150, so this is sized as a mark, not a large portrait.
 */
export function InstagramPortrait({ size }: { size: PortraitSize }) {
  return (
    <a
      href={site.instagram}
      className={`ig-portrait ig-portrait--${size}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Maurice Garcia on Instagram, @${site.instagramHandle}`}
    >
      <span className="ig-portrait-glow" aria-hidden="true" />
      <span className="ig-portrait-ring" aria-hidden="true" />
      <span className="ig-portrait-frame">
        <Image
          src={site.instagramPhoto}
          alt="Maurice Garcia at sunset on a beach boardwalk, wearing a black cap"
          width={150}
          height={150}
          sizes={size === "nav" ? "40px" : "(max-width: 760px) 72px, 88px"}
          priority={size === "nav"}
        />
      </span>
    </a>
  );
}
