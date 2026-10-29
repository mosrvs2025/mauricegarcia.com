import { abs, site } from "./site";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
/** Control characters are illegal in XML 1.0; strip them so a stray one cannot break every reader. */
const clean = (s: string) => esc(s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ""));

export type FeedItem = { id: string; title: string; url: string; summary: string; date: string; categories?: string[] };

export function rss(opts: { title: string; description: string; path: string; items: FeedItem[] }): string {
  const items = opts.items.map((i) => `    <item>
      <title>${clean(i.title)}</title>
      <link>${clean(i.url)}</link>
      <guid isPermaLink="false">${clean(i.id)}</guid>
      <pubDate>${new Date(i.date).toUTCString()}</pubDate>
      <description>${clean(i.summary)}</description>${(i.categories ?? []).map((c) => `\n      <category>${clean(c)}</category>`).join("")}
    </item>`).join("\n");
  const last = opts.items[0] ? new Date(opts.items[0].date).toUTCString() : new Date().toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${clean(opts.title)}</title>
    <link>${abs(opts.path.replace(/rss\.xml$/, ""))}</link>
    <description>${clean(opts.description)}</description>
    <language>en-us</language>
    <managingEditor>${site.email} (${site.name})</managingEditor>
    <lastBuildDate>${last}</lastBuildDate>
    <atom:link href="${abs(opts.path)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

export const rssResponse = (xml: string) => new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } });
