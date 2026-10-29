import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PostArticle, UpdateArticle } from "@/components/Articles";
import { getItem, ITEM_TYPES, type ItemType, type PostDoc } from "@/lib/studio/service";
import { requireOwner, studioStore } from "@/lib/studio/session";
import { SetupNeeded } from "../../../login/page";
import type { Update } from "@/lib/content/schemas";

/** Full-fidelity preview: the same article components the public pages use, fed from the saved (not yet live) file. */
export default async function PreviewPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (!ITEM_TYPES.includes(type as ItemType) || type === "now") notFound();
  const who = await requireOwner();
  if (!who.ok) { if (!who.configured) return <SetupNeeded reason={who.reason} />; redirect("/studio/login"); }
  const { store } = studioStore();
  if (!store) return <p className="j-notice">Saving isn't configured, so there's nothing to preview.</p>;
  const item = await getItem(store, type as ItemType, id).catch(() => null);
  if (!item) notFound();
  return (
    <>
      <p className="st-actions" style={{ marginBottom: 16 }}><Link className="j-link" href="/studio">← Studio</Link><Link className="j-link" href={`/studio/edit/${type}/${id}`}>Edit</Link></p>
      {type === "update" ? <UpdateArticle update={item.doc as Update} preview /> : <PostArticle post={{ ...(item.doc as PostDoc), readingMinutes: Math.max(1, Math.round((item.doc as PostDoc).body.split(/\s+/).length / 220)) }} preview />}
    </>
  );
}
