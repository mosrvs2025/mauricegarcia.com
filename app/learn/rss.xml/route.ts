import { rss, rssResponse } from "@/lib/feeds";
import { listedLessons } from "@/lib/content/query";
import { abs } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const items = listedLessons().filter((l) => l.publishedAt).map((l) => ({ id: abs(`/learn/${l.slug}`), title: l.title, url: abs(`/learn/${l.slug}`), summary: l.summary, date: l.publishedAt!, categories: [l.level, l.kind, ...l.tools] }));
  return rssResponse(rss({ title: "Maurice Garcia: learn", description: "Practical lessons on building useful things with AI.", path: "/learn/rss.xml", items }));
}
