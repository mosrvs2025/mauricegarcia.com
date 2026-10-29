import { notFound, redirect } from "next/navigation";
import { Editor } from "@/components/studio/Editor";
import { getItem, historyOf, ITEM_TYPES, listAll, newUpdateDoc, type ItemType } from "@/lib/studio/service";
import { requireOwner, studioStore } from "@/lib/studio/session";
import { SetupNeeded } from "../../../login/page";
import { slugify } from "@/lib/sync/sanitize";

export default async function EditPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (!ITEM_TYPES.includes(type as ItemType)) notFound();
  const who = await requireOwner();
  if (!who.ok) { if (!who.configured) return <SetupNeeded reason={who.reason} />; redirect("/studio/login"); }
  const { store, reason } = studioStore();
  if (!store) return <p className="j-notice">Saving isn't configured: {reason}</p>;
  const t = type as ItemType;
  const projects = (await listAll(store)).filter((e) => e.type === "project").map((e) => ({ id: e.id, title: e.title }));
  let doc: any; let sha: string | undefined; let path = ""; let history: Awaited<ReturnType<typeof historyOf>> = [];
  if (id === "new") {
    const now = new Date(); const day = now.toISOString().slice(0, 10);
    if (t === "update") doc = newUpdateDoc("Untitled update", now);
    else if (t === "post") doc = { id: `post-${day.replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6)}`, slug: slugify("untitled post-" + day), title: "Untitled post", description: "A sentence that says what this is about.", status: "draft", visibility: "public", kind: "essay", tags: [], projectIds: [], provenance: { origin: "manual" }, body: "" };
    else notFound();
  } else {
    const item = await getItem(store, t, id).catch(() => null);
    if (!item) notFound();
    doc = item.doc; sha = item.sha; path = item.path;
    history = await historyOf(store, path).catch(() => []);
  }
  return <Editor type={t} doc={doc} sha={sha} path={path} isNew={id === "new"} projects={projects} history={history} />;
}
