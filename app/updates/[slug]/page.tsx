import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UpdateArticle } from "@/components/Articles";
import { shownUpdates, updateBySlug } from "@/lib/content/query";
import { isListed } from "@/lib/content/visibility";

export const dynamicParams = false;
export const generateStaticParams = () => shownUpdates().map((u) => ({ slug: u.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const u = updateBySlug((await params).slug);
  if (!u) return {};
  return {
    title: u.title, description: u.summary, alternates: { canonical: `/updates/${u.slug}` },
    robots: isListed(u) ? undefined : { index: false, follow: false },
    openGraph: { type: "article", title: u.title, description: u.summary, url: `/updates/${u.slug}`, publishedTime: u.publishedAt },
    twitter: { card: "summary_large_image", title: u.title, description: u.summary },
  };
}

export default async function UpdatePage({ params }: { params: Promise<{ slug: string }> }) {
  const u = updateBySlug((await params).slug);
  if (!u) notFound();
  return <UpdateArticle update={u} />;
}
