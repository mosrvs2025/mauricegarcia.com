"use client";
export function SignOut() {
  return <button type="button" className="btn btn-quiet btn-sm" onClick={async () => { await fetch("/api/studio/logout", { method: "POST" }); window.location.assign("/studio/login"); }}>Sign out</button>;
}
