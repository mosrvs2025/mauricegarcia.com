import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostArticle } from "@/components/Articles";
import { postBySlug, shownPosts } from "@/lib/content/query";
import { isListed } from "@/lib/content/visibility";

export const dynamicParams = false;
export const generateStaticParams = () => shownPosts().map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = postBySlug((await params).slug);
  if (!p) return {};
  return {
    title: p.title, description: p.description, alternates: { canonical: `/writing/${p.slug}` },
    robots: isListed(p) ? undefined : { index: false, follow: false },
    openGraph: { type: "article", title: p.title, description: p.description, url: `/writing/${p.slug}`, publishedTime: p.publishedAt, modifiedTime: p.updatedAt, tags: p.tags },
    twitter: { card: "summary_large_image", title: p.title, description: p.description },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = postBySlug((await params).slug);
  if (!p) notFound();
  return <PostArticle post={p} />;
}
