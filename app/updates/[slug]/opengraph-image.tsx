import { notFound } from "next/navigation";
import { ogImage, ogSize } from "@/lib/og";
import { shownUpdates, updateBySlug } from "@/lib/content/query";

export const alt = "Update preview";
export const size = ogSize;
export const contentType = "image/png";
export const dynamicParams = false;
export const generateStaticParams = () => shownUpdates().map((u) => ({ slug: u.slug }));

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const u = updateBySlug((await params).slug);
  if (!u) notFound();
  return ogImage({ kicker: "Update", title: u.title, subtitle: u.summary, seed: u.slug });
}
