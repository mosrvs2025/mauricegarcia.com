import type { Metadata } from "next";
import { ConnectForm } from "@/components/ConnectForm";
import { ContactActions } from "@/components/ContactActions";

export const metadata: Metadata = { title: "Say hello", description: "Have an idea, a question, or just want to connect? My inbox is open." };

/**
 * The one contact page. Every "Contact" or "Say hello" link on the site comes here. Older links may still carry
 * ?intent=, ?service= or ?project=; they open this same page, and the visitor's message supplies the context.
 */
export default function ConnectPage() {
  return (
    <div className="studio-wrap connect-page">
      <header className="j-page-head connect-head">
        <p className="eyebrow">Connect</p>
        <h1 className="display">Say hello.</h1>
        <p className="lede">Have an idea, a question, or just want to connect? My inbox is open.</p>
        <ContactActions variant="page" />
      </header>
      <section className="connect-panel j-surface" aria-label="Send a message">
        <ConnectForm />
      </section>
    </div>
  );
}
