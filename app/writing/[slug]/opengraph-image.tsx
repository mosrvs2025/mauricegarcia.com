import { notFound } from "next/navigation";
import { ogImage, ogSize } from "@/lib/og";
import { postBySlug, shownPosts } from "@/lib/content/query";

export const alt = "Writing preview";
export const size = ogSize;
export const contentType = "image/png";
export const dynamicParams = false;
export const generateStaticParams = () => shownPosts().map((p) => ({ slug: p.slug }));

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = postBySlug((await params).slug);
  if (!p) notFound();
  return ogImage({ kicker: `Writing · ${p.kind}`, title: p.title, subtitle: p.description });
}
