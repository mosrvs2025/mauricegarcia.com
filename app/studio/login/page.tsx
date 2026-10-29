import { redirect } from "next/navigation";
import { LoginForm } from "@/components/studio/LoginForm";
import { authConfig } from "@/lib/studio/auth";
import { requireOwner } from "@/lib/studio/session";

export default async function LoginPage() {
  const cfg = authConfig();
  if (!cfg.ok) return <SetupNeeded reason={cfg.reason} />;
  if ((await requireOwner()).ok) redirect("/studio");
  return (<div className="j-wrap-narrow" style={{ marginInline: 0 }}><h1 className="display">Studio</h1><p className="j-muted" style={{ margin: "12px 0 24px" }}>Owner sign-in. Your session lasts 12 hours on this device.</p><LoginForm /></div>);
}

export function SetupNeeded({ reason }: { reason: string }) {
  return (
    <div className="j-wrap-narrow" style={{ marginInline: 0 }}>
      <h1 className="display">Studio isn't switched on yet</h1>
      <p className="j-notice" style={{ marginTop: 18 }}>{reason} The editor stays off until it can be locked behind your passphrase. Nothing here is a placeholder: no page that looks like an editor will appear without real authentication and real saving.</p>
      <p style={{ marginTop: 18 }} className="j-muted">Setup steps are in <code>docs/OWNER_GUIDE.md</code> under “Turn on the studio”.</p>
    </div>
  );
}
