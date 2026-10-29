import { rss, rssResponse } from "@/lib/feeds";
import { listedUpdates } from "@/lib/content/query";
import { abs } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  // Feed date = when the work happened (eventAt), so retried imports never reshuffle readers' feeds.
  const items = listedUpdates().map((u) => ({
    id: abs(`/updates/${u.slug}`), title: u.title, url: abs(`/updates/${u.slug}`),
    summary: [u.summary, u.whyCare, u.limitations ? `Limits: ${u.limitations}` : ""].filter(Boolean).join(" "), date: u.eventAt.length === 10 ? `${u.eventAt}T12:00:00Z` : u.eventAt, categories: u.tags,
  }));
  return rssResponse(rss({ title: "Maurice Garcia: updates", description: "Short dated progress notes on what I'm building.", path: "/updates/rss.xml", items }));
}
