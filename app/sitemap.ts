import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/work", "/services", "/shop", "/about", "/contact"];
  return paths.map((p) => ({
    url: `${site.url}${p || "/"}`,
    lastModified: new Date("2026-09-02"),
  }));
}
