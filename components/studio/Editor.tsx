"use client";
import Link from "next/link";
import { useRef, useState } from "react";

type Hist = { sha: string; date: string; message: string; author: string }[];
type Props = { type: "update" | "post" | "now"; doc: any; sha?: string; path: string; isNew: boolean; projects: { id: string; title: string }[]; history: Hist };

const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export function Editor({ type, doc: initial, sha: initialSha, path, isNew, projects, history }: Props) {
  const [doc, setDoc] = useState<any>(initial);
  const [sha, setSha] = useState(initialSha);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; issues?: string[] } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hist, setHist] = useState<Hist>(history);
  const [tags, setTags] = useState((initial.tags ?? []).join(", "));
  const [evidence, setEvidence] = useState({ label: initial.evidence?.[0]?.label ?? "", url: initial.evidence?.[0]?.url ?? "" });
  const [nowText, setNowText] = useState({
    building: (initial.building ?? []).map((b: any) => (b.projectId ? `${b.text} | ${b.projectId}` : b.text)).join("\n"),
    exploring: (initial.exploring ?? []).join("\n"),
    welcome: (initial.welcome ?? []).map((w: any) => `${w.intent} | ${w.text}`).join("\n"),
  });
  const saved = useRef(!isNew);
  const [curPath, setCurPath] = useState(path);
  const set = (k: string, v: unknown) => setDoc((d: any) => ({ ...d, [k]: v }));

  function build(status?: string) {
    let d = { ...doc };
    if (status) d.status = status;
    // The slug follows the title until the first save, then stays fixed so links never break.
    if (isNew && !saved.current && type === "update") d.slug = `${String(d.eventAt).slice(0, 10)}-${String(d.title).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 56).replace(/-+$/, "") || "update"}`;
    if (type !== "now") d.tags = csv(tags).map((t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).filter(Boolean);
    if (type === "update") {
      d.evidence = evidence.url ? [{ label: evidence.label || "Evidence", url: evidence.url, kind: "other" }] : [];
      for (const k of ["whyCare", "limitations", "body", "projectId"]) if (!d[k]) delete d[k];
    }
    if (type === "now") {
      d.building = lines(nowText.building).map((l) => { const [text, projectId] = l.split("|").map((x) => x.trim()); return projectId ? { text, projectId } : { text }; });
      d.exploring = lines(nowText.exploring);
      d.welcome = lines(nowText.welcome).map((l) => { const [intent, ...rest] = l.split("|"); return { intent: intent.trim(), text: rest.join("|").trim() }; });
    }
    return d;
  }

  async function call(url: string, payload: unknown, quiet = false) {
    setBusy(true); if (!quiet) setResult(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { if (!quiet) setResult({ ok: false, text: j.error || "Failed.", issues: j.issues }); return null; }
      return j;
    } catch { if (!quiet) setResult({ ok: false, text: "Couldn't reach the server. Your text is still here; try again." }); return null; }
    finally { setBusy(false); }
  }

  async function save(status?: string) {
    const d = build(status);
    const j = await call("/api/studio/save", { type, doc: d, expectedSha: saved.current ? sha : undefined });
    if (!j) return;
    setDoc(d); setSha(j.sha); saved.current = true;
    if (j.path) { setCurPath(j.path); const h = await call("/api/studio/history", { path: j.path }, true); if (h) setHist(h.history); }
    setResult({ ok: true, text: d.status === "published" ? "Published. It goes live on the next deploy, usually within a couple of minutes." : "Saved." });
    if (isNew && typeof window !== "undefined") window.history.replaceState(null, "", `/studio/edit/${type}/${d.id}`);
  }

  async function showPreview() {
    const j = await call("/api/studio/preview", { body: doc.body ?? "" });
    if (j) setPreview(j.html);
  }

  async function restore(ref: string) {
    if (!window.confirm("Restore this earlier version? It will be saved as a new change, and nothing is erased.")) return;
    const j = await call("/api/studio/restore", { type, path: curPath, ref });
    if (j) window.location.reload();
  }

  const id = doc.id as string;
  const isLive = doc.status === "published";
  return (
    <div>
      <div className="st-bar"><h1 className="display">{type === "now" ? "Now page" : `${isNew ? "New " : "Edit "}${type}`}</h1><Link className="j-link" href="/studio">← Studio</Link></div>
      {doc.status === "proposed" && <p className="j-notice" style={{ marginBottom: 18 }}>This is proposed text waiting for your review. Edit it to your voice, then publish when you're happy.</p>}
      {doc.provenance?.origin && doc.provenance.origin !== "manual" && <p className="j-notice" style={{ marginBottom: 18 }}>This started as an {doc.provenance.origin === "agent" ? "agent note" : "automated import"}. Saving marks it as edited by you, so later syncs will never overwrite it.</p>}
      <div className="st-grid">
        <form className="j-form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
          {type !== "now" && <label>Title<input value={doc.title} maxLength={140} onChange={(e) => set("title", e.target.value)} required /></label>}
          {type === "update" && <>
            <label>Summary <span className="hint">One or two sentences.</span><textarea rows={3} value={doc.summary} maxLength={400} onChange={(e) => set("summary", e.target.value)} required /></label>
            <label>Why a visitor should care<textarea rows={2} value={doc.whyCare ?? ""} maxLength={400} onChange={(e) => set("whyCare", e.target.value)} /></label>
            <label>What's unfinished or unverified<textarea rows={2} value={doc.limitations ?? ""} maxLength={400} onChange={(e) => set("limitations", e.target.value)} /></label>
            <label>More detail <span className="hint">Markdown</span><textarea rows={6} value={doc.body ?? ""} onChange={(e) => set("body", e.target.value)} /></label>
            <div className="j-two">
              <label>Kind<select value={doc.kind} onChange={(e) => set("kind", e.target.value)}>{["progress", "demo", "lesson", "release", "call-for-help", "note"].map((k) => <option key={k}>{k}</option>)}</select></label>
              <label>Project<select value={doc.projectId ?? ""} onChange={(e) => set("projectId", e.target.value)}><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
            </div>
            <label>When the work happened <span className="hint">YYYY-MM-DD</span><input value={doc.eventAt} onChange={(e) => set("eventAt", e.target.value)} required /></label>
            <div className="j-two"><label>Evidence label<input value={evidence.label} onChange={(e) => setEvidence({ ...evidence, label: e.target.value })} /></label><label>Evidence link <span className="hint">https only</span><input value={evidence.url} onChange={(e) => setEvidence({ ...evidence, url: e.target.value })} inputMode="url" /></label></div>
          </>}
          {type === "post" && <>
            <label>Description <span className="hint">Shown in lists and link previews.</span><textarea rows={2} value={doc.description} maxLength={300} onChange={(e) => set("description", e.target.value)} required /></label>
            <div className="j-two">
              <label>Slug {isNew ? "" : <span className="hint">(fixed once saved)</span>}<input value={doc.slug} readOnly={!isNew} onChange={(e) => set("slug", e.target.value)} /></label>
              <label>Kind<select value={doc.kind} onChange={(e) => set("kind", e.target.value)}>{["essay", "tutorial", "reflection"].map((k) => <option key={k}>{k}</option>)}</select></label>
            </div>
            <label>Body <span className="hint">Markdown. Raw HTML is shown as text, never run.</span><textarea rows={16} value={doc.body} onChange={(e) => set("body", e.target.value)} required /></label>
            <fieldset><legend>Related projects</legend><div style={{ display: "grid", gap: 6, marginTop: 8 }}>{projects.map((p) => <label key={p.id} style={{ fontWeight: 400 }}><input type="checkbox" style={{ width: "auto", marginRight: 8 }} checked={(doc.projectIds ?? []).includes(p.id)} onChange={(e) => set("projectIds", e.target.checked ? [...(doc.projectIds ?? []), p.id] : (doc.projectIds ?? []).filter((x: string) => x !== p.id))} />{p.title}</label>)}</div></fieldset>
          </>}
          {type === "now" && <>
            <label>Current focus <span className="hint">Shown on the home page.</span><textarea rows={4} maxLength={400} value={doc.focus} onChange={(e) => set("focus", e.target.value)} required /></label>
            <label>Building <span className="hint">One per line. Optionally “text | project-id”.</span><textarea rows={3} value={nowText.building} onChange={(e) => setNowText({ ...nowText, building: e.target.value })} /></label>
            <label>Exploring <span className="hint">One per line.</span><textarea rows={3} value={nowText.exploring} onChange={(e) => setNowText({ ...nowText, exploring: e.target.value })} /></label>
            <label>Welcome <span className="hint">One per line: “hello|collaborate|paid-work|coaching | text”.</span><textarea rows={4} value={nowText.welcome} onChange={(e) => setNowText({ ...nowText, welcome: e.target.value })} /></label>
            <label>Reviewed on <span className="hint">YYYY-MM-DD. Set this when you've actually read it over.</span><input value={doc.reviewedAt} onChange={(e) => set("reviewedAt", e.target.value)} required /></label>
          </>}
          {type !== "now" && <label>Tags <span className="hint">Comma separated.</span><input value={tags} onChange={(e) => setTags(e.target.value)} /></label>}
          {type !== "now" && <label>Visibility<select value={doc.visibility} onChange={(e) => set("visibility", e.target.value)}><option value="public">Public: listed and in the feed</option><option value="unlisted">Unlisted: has a page, not listed</option><option value="private">Private: never generated</option></select></label>}

          <div className="st-actions">
            <button className="btn btn-quiet btn-sm" disabled={busy} type="submit">{busy ? "Working…" : "Save draft"}</button>
            {(type === "update" || type === "post") && <button type="button" className="btn btn-fill btn-sm" disabled={busy} onClick={() => save("published")}>{isLive ? "Save and keep published" : "Publish"}</button>}
            {type === "now" && <button type="button" className="btn btn-fill btn-sm" disabled={busy} onClick={() => save("published")}>Publish</button>}
            {isLive && type !== "now" && <button type="button" className="btn btn-quiet btn-sm" disabled={busy || !saved.current} onClick={async () => { const j = await call("/api/studio/save", { type, id, to: "draft" }); if (j) { set("status", "draft"); setSha(j.sha); setResult({ ok: true, text: "Unpublished. It's a draft again after the next deploy." }); } }}>Unpublish</button>}
            {(type === "update" || type === "post") && <button type="button" className="btn btn-quiet btn-sm" disabled={busy} onClick={showPreview}>Preview text</button>}
            {saved.current && type !== "now" && <Link className="j-link" href={`/studio/preview/${type}/${id}`}>Full preview</Link>}
          </div>
          <p className="j-muted" style={{ fontSize: ".9rem" }}>Status: <span className={`st-pill ${doc.status}`}>{doc.status}</span> {doc.status !== "published" && "Not public."}</p>
          {result && <div role={result.ok ? "status" : "alert"} className={result.ok ? "j-ok" : "j-error"}>{result.text}{result.issues && <ul style={{ marginTop: 8, paddingLeft: 18, listStyle: "disc" }}>{result.issues.map((i) => <li key={i}>{i}</li>)}</ul>}</div>}
        </form>

        <aside>
          {preview !== null && <div className="st-card" style={{ marginBottom: 24 }}><h2 className="eyebrow" style={{ margin: 0 }}>Preview</h2><div className="j-prose" style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: preview }} /></div>}
          <div className="st-card">
            <h2 className="eyebrow" style={{ margin: 0 }}>History and rollback</h2>
            {hist.length === 0 ? <p className="j-muted" style={{ marginTop: 10 }}>No saved versions yet.</p> : (
              <ul className="j-list-plain" style={{ marginTop: 10 }}>{hist.map((h, i) => (
                <li key={h.sha}><span style={{ fontSize: ".9rem" }}>{h.message}</span><br /><span className="j-muted" style={{ fontSize: ".8rem" }}>{h.date.slice(0, 16).replace("T", " ")} · {h.sha.slice(0, 7)}</span>
                  {i > 0 && <><br /><button type="button" className="btn btn-quiet btn-sm" style={{ marginTop: 8 }} disabled={busy} onClick={() => restore(h.sha)}>Restore this version</button></>}</li>))}</ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
