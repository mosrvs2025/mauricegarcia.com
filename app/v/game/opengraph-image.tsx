import { ogImage, ogSize } from "@/lib/og";

export const alt = "Maurice Garcia's portfolio as a level-select game";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({ kicker: "Press start", title: "Choose your level", subtitle: "Every project is a level. Walk the map, then play.", seed: "game", accent: "#ffcc33", badge: "Play" });
}
