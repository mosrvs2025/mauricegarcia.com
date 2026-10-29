import { notFound } from "next/navigation";
import { ogImage, ogSize } from "@/lib/og";
import { projectBySlug, shownProjects, STATE_LABELS } from "@/lib/content/query";

export const alt = "Project preview";
export const size = ogSize;
export const contentType = "image/png";
export const dynamicParams = false;
export const generateStaticParams = () => shownProjects().map((p) => ({ slug: p.slug }));

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = projectBySlug((await params).slug);
  if (!p) notFound();
  return ogImage({ kicker: `Project · ${STATE_LABELS[p.state]}`, title: p.title, subtitle: p.tagline });
}
