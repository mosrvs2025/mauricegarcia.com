/**
 * The one place that decides whether content may reach a visitor.
 * Everything public (pages, lists, feeds, sitemap, search index, OG images)
 * goes through isShown / isListed, so a draft or private item has no route in.
 */
type Gated = { status: string; visibility: string };

/** Preview builds may show 'proposed' content. Never honoured on a production deployment. */
export function isPreviewBuild(): boolean {
  return process.env.SITE_PREVIEW === "1" && process.env.VERCEL_ENV !== "production";
}

export function isShown(item: Gated): boolean {
  if (item.visibility === "private") return false;
  if (item.status === "published") return true;
  return item.status === "proposed" && isPreviewBuild();
}

/** Appears in lists, feeds, sitemap and search. Unlisted items have a page only. */
export function isListed(item: Gated): boolean {
  return isShown(item) && item.visibility === "public";
}

export function isProposed(item: Gated): boolean {
  return item.status === "proposed";
}
