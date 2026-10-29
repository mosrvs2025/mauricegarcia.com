import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/** Former project slugs redirect to the current page. Read straight from content so the file stays the source of truth. */
function projectRedirects() {
  const dir = path.join(process.cwd(), "content", "projects");
  if (!fs.existsSync(dir)) return [];
  const out: { source: string; destination: string; permanent: boolean }[] = [];
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    try {
      const p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      for (const old of p.formerSlugs ?? []) out.push({ source: `/projects/${old}`, destination: `/projects/${p.slug}`, permanent: true });
    } catch { /* validation reports malformed files */ }
  }
  return out;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    return [
      // Moved URLs. Query strings (for example ?service=) are carried through.
      { source: "/contact", destination: "/connect", permanent: true },
      { source: "/work", destination: "/projects/pipeline-crm", permanent: true },
      ...projectRedirects(),
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] },
      { source: "/studio/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "X-Frame-Options", value: "DENY" }, { key: "Cache-Control", value: "no-store" }] },
      { source: "/api/studio/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
