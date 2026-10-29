import { rss, rssResponse } from "@/lib/feeds";
import { listedPosts } from "@/lib/content/query";
import { abs } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const items = listedPosts().filter((p) => p.publishedAt).map((p) => ({ id: abs(`/writing/${p.slug}`), title: p.title, url: abs(`/writing/${p.slug}`), summary: p.description, date: p.updatedAt && p.updatedAt > p.publishedAt! ? p.publishedAt! : p.publishedAt!, categories: p.tags }));
  return rssResponse(rss({ title: "Maurice Garcia: writing", description: "Essays, tutorials and reflections.", path: "/writing/rss.xml", items }));
}
