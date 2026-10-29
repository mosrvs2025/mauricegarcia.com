"use client";
import { useState } from "react";

export function SyncNow() {
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(false); const [busy, setBusy] = useState(false);
  return (
    <div>
      <button className="btn btn-fill btn-sm" disabled={busy} onClick={async () => {
        setBusy(true); setMsg(""); const res = await fetch("/api/studio/sync", { method: "POST" }); const j = await res.json().catch(() => ({}));
        setErr(!res.ok); setMsg(j.message || j.error || (res.ok ? "Requested." : "Failed.")); setBusy(false);
      }}>{busy ? "Requesting…" : "Sync now"}</button>
      {msg && <p role={err ? "alert" : "status"} className={err ? "j-error" : "j-ok"} style={{ marginTop: 14 }}>{msg}</p>}
    </div>
  );
}
