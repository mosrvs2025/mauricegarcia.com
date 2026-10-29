"use client";
import { useState } from "react";

export function LoginForm() {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <form className="j-form" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setError("");
      const res = await fetch("/api/studio/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passphrase: new FormData(e.currentTarget).get("passphrase") }) });
      const j = await res.json().catch(() => ({}));
      if (res.ok) window.location.assign("/studio"); else { setError(j.error || "Could not sign in."); setBusy(false); }
    }}>
      <label>Passphrase<input name="passphrase" type="password" autoComplete="current-password" required /></label>
      {error && <p role="alert" className="j-error">{error}</p>}
      <div><button className="btn btn-fill" disabled={busy}>{busy ? "Checking…" : "Sign in"}</button></div>
    </form>
  );
}
