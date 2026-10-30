import { ogImage, ogSize } from "@/lib/og";

export const alt = "Maurice Garcia, Experience Engineer: useful products and unexpected worlds";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({ kicker: "Experience Engineer", title: "Useful products. Unexpected worlds.", subtitle: "Software, AI tools and interactive experiences, built to work.", seed: "home" });
}
