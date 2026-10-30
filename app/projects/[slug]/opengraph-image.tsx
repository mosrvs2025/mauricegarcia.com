import { notFound } from "next/navigation";
import { OG_ACCENTS, ogImage, ogSize } from "@/lib/og";
import { projectBySlug, shownProjects, MATURITY_LABELS, TRACK_LABELS } from "@/lib/content/query";

export const alt = "Project preview";
export const size = ogSize;
export const contentType = "image/png";
export const dynamicParams = false;
export const generateStaticParams = () => shownProjects().map((p) => ({ slug: p.slug }));

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = projectBySlug((await params).slug);
  if (!p) notFound();
  return ogImage({ kicker: TRACK_LABELS[p.track].title, title: p.title, subtitle: p.tagline, seed: p.slug, accent: OG_ACCENTS[p.track], badge: MATURITY_LABELS[p.maturity] });
}
