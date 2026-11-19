import type { Metadata } from "next";
import { ConnectForm } from "@/components/ConnectForm";
import { ContactSplitControl } from "@/components/ContactActions";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Say hello",
  description: "Have an idea, a question, or just want to connect? My inbox is open.",
};

export default function ConnectPage() {
  return (
    <div className="studio-wrap connect-page">
      <header className="j-page-head connect-head">
        <p className="eyebrow">Connect</p>
        <h1 className="display">Say hello.</h1>
        <p className="lede">Have an idea, a question, or just want to connect? My inbox is open.</p>
        <div className="connect-direct-actions">
          <ContactSplitControl email={site.email} variant="page" />
        </div>
      </header>
      <div className="j-wrap-narrow connect-body">
        <ConnectForm />
      </div>
    </div>
  );
}
