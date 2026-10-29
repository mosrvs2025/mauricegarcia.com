import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOut } from "@/components/studio/SignOut";
import { listAll } from "@/lib/studio/service";
import { requireOwner, studioStore } from "@/lib/studio/session";
import { SetupNeeded } from "./login/page";

export default async function StudioHome() {
  const who = await requireOwner();
  if (!who.ok) { if (!who.configured) return <SetupNeeded reason={who.reason} />; redirect("/studio/login"); }
  const { store, reason } = studioStore();
  const items = store ? await listAll(store).catch(() => null) : null;
  const group = (t: string) => (items ?? []).filter((i) => i.type === t);
  const Table = ({ rows, editable }: { rows: NonNullable<typeof items>; editable: boolean }) => rows.length === 0 ? <p className="j-muted">Nothing yet.</p> : (
    <table className="st-table"><thead><tr><th>Title</th><th>State</th><th>Date</th><th></th></tr></thead><tbody>
      {rows.map((r) => (
        <tr key={r.path}><td>{r.title}{r.origin && r.origin !== "manual" && <span className="j-muted"> · {r.origin === "agent" ? "from an agent note" : "imported"}</span>}</td>
          <td><span className={`st-pill ${r.status}`}>{r.status}</span></td><td>{r.date}</td>
          <td>{editable && (r.type === "update" || r.type === "post" || r.type === "now") ? <span className="st-actions"><Link className="j-link" href={`/studio/edit/${r.type}/${r.id}`}>Edit</Link><Link className="j-link" href={`/studio/preview/${r.type}/${r.id}`}>Preview</Link></span> : <span className="j-muted">edit in Git</span>}</td></tr>
      ))}
    </tbody></table>
  );
  return (
    <>
      <div className="st-bar"><h1 className="display">Studio</h1><div className="st-actions"><Link className="btn btn-fill btn-sm" href="/studio/edit/update/new">New update</Link><Link className="btn btn-quiet btn-sm" href="/studio/edit/post/new">New post</Link><Link className="btn btn-quiet btn-sm" href="/studio/sync">Sync</Link><SignOut /></div></div>
      {!store && <p className="j-notice">Signed in, but saving isn't configured: {reason} You can read this page but not edit. See <code>docs/OWNER_GUIDE.md</code>.</p>}
      {store && items === null && <p className="j-error">Couldn't read content from {store.mode === "github" ? "GitHub" : "disk"}. Try again in a minute; the live site is unaffected.</p>}
      {items && <>
        <p className="j-muted">Storage: {store!.mode === "github" ? "GitHub (every save is a commit)" : "local files (development only)"}. Published changes appear after the next deploy, usually within a couple of minutes.</p>
        <h2 className="display">Updates</h2><Table rows={group("update")} editable />
        <h2 className="display">Writing</h2><Table rows={group("post")} editable />
        <h2 className="display">Now page</h2><Table rows={group("now")} editable />
        <h2 className="display">Projects</h2><Table rows={group("project")} editable={false} />
      </>}
    </>
  );
}
