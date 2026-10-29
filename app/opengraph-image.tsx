import { ogImage, ogSize } from "@/lib/og";

export const alt = "Maurice Garcia: useful tools, playful worlds, experiments worth trying";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({ kicker: "Workshop & journal", title: "Maurice Garcia", subtitle: "I build useful tools, playful worlds, and experiments worth trying." });
}
