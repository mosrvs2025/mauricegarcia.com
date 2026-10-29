import Link from "next/link";
import { redirect } from "next/navigation";
import { SyncNow } from "@/components/studio/SyncNow";
import { syncStatusSchema } from "@/lib/content/schemas";
import { requireOwner, studioStore } from "@/lib/studio/session";
import { SetupNeeded } from "../login/page";

export default async function SyncPage() {
  const who = await requireOwner();
  if (!who.ok) { if (!who.configured) return <SetupNeeded reason={who.reason} />; redirect("/studio/login"); }
  const { store } = studioStore();
  let status = null; let note = "";
  if (store) {
    const f = await store.read("content/sync-status.json").catch(() => null);
    if (f) { const p = syncStatusSchema.safeParse(JSON.parse(f.content)); if (p.success) status = p.data; else note = "sync-status.json doesn't match its schema."; }
    else note = "No sync has recorded anything yet.";
  } else note = "Storage isn't configured, so status can't be read.";
  const repo = process.env.STUDIO_GITHUB_REPO || "mosrvs2025/mauricegarcia.com";
  return (
    <>
      <div className="st-bar"><h1 className="display">Sync</h1><Link className="j-link" href="/studio">← Studio</Link></div>
      <p className="j-muted">The site never calls GitHub when someone visits. This job collects meaningful completed work from the repositories on the allowlist into <em>draft</em> updates, and only your per-project opt-in can publish a verified release note.</p>
      <div className="st-card" style={{ margin: "22px 0" }}>
        {status ? <dl className="j-facts" style={{ margin: 0, padding: 0, border: 0 }}>
          <div><dt>Last attempt that changed something</dt><dd>{status.lastAttemptAt ?? "never"}</dd></div>
          <div><dt>Last fully successful sync</dt><dd>{status.lastSuccessAt ?? "never"}</dd></div>
        </dl> : <p>{note}</p>}
        <p className="j-muted" style={{ marginTop: 14, fontSize: ".9rem" }}>A quiet sync with nothing new makes no commit, so these dates can lag. The Actions tab shows every run, including quiet ones: <a className="j-link" href={`https://github.com/${repo}/actions/workflows/sync.yml`}>sync workflow runs</a>.</p>
      </div>
      {status && <table className="st-table"><thead><tr><th>Source</th><th>Last success</th><th>Imported</th><th>Unchanged</th><th>Last error</th></tr></thead><tbody>
        {Object.entries(status.sources).map(([id, s]) => <tr key={id}><td>{id}</td><td>{s.lastSuccessAt ?? "never"}</td><td>{s.imported}</td><td>{s.unchanged}</td>
          <td>{s.lastError ? <><span className="st-pill invalid">failed</span> {s.lastError}<br /><span className="j-muted">The site still shows the last good content. Retry with “Sync now”. If it mentions a token, renew <code>SYNC_READ_TOKEN</code>.</span></> : <span className="st-pill published">ok</span>}</td></tr>)}
      </tbody></table>}
      <div style={{ marginTop: 28 }}><SyncNow /></div>
    </>
  );
}
