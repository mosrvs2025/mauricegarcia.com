import type { MetadataRoute } from "next";
import { listedLessons, listedPosts, listedProjects, listedUpdates } from "@/lib/content/query";
import { abs } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const day = (s?: string) => (s ? new Date(s.length === 10 ? `${s}T12:00:00Z` : s) : undefined);
  const statics = ["", "/projects", "/learn", "/writing", "/updates", "/now", "/about", "/connect", "/services", "/coaching", "/ai-receptionist", "/shop", "/lab", ...["paper", "terminal", "pop", "glass", "swiss", "arcade"].map((s) => `/lab/${s}`)];
  return [
    ...statics.map((p) => ({ url: abs(p || "/") })),
    ...listedProjects().map((p) => ({ url: abs(`/projects/${p.slug}`), lastModified: day(p.dates.lastChange ?? p.dates.reviewed) })),
    ...listedPosts().map((p) => ({ url: abs(`/writing/${p.slug}`), lastModified: day(p.updatedAt ?? p.publishedAt) })),
    ...listedLessons().map((l) => ({ url: abs(`/learn/${l.slug}`), lastModified: day(l.updatedAt ?? l.publishedAt) })),
    ...listedUpdates().map((u) => ({ url: abs(`/updates/${u.slug}`), lastModified: day(u.eventAt) })),
  ];
}
