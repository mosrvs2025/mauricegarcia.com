import type { MetadataRoute } from "next";
import { AI_CRAWLERS, ROBOTS_DISALLOW } from "@/lib/seo";
import { abs } from "@/lib/site";

// A crawler with its own group ignores the "*" group, so each one repeats the disallows
// instead of being accidentally let into the owner studio or the API.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ROBOTS_DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: ROBOTS_DISALLOW })),
    ],
    sitemap: abs("/sitemap.xml"),
  };
}
