import type { Metadata } from "next";
import { ConnectForm } from "@/components/ConnectForm";
import { INTENTS, type Intent } from "@/lib/contact";
import { shownProjects } from "@/lib/content/query";
import { serviceBySlug } from "@/lib/services";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Say hello", description: "Write to me about a collaboration, paid work, coaching, or just to say hello. No budget needed for a friendly introduction." };

type Params = Promise<{ intent?: string; service?: string; project?: string }>;

export default async function ConnectPage({ searchParams }: { searchParams: Params }) {
  const q = await searchParams;
  const service = serviceBySlug(q.service);
  const projects = shownProjects().map((p) => ({ slug: p.slug, title: p.title }));
  const intent: Intent = (INTENTS as readonly string[]).includes(q.intent ?? "") ? (q.intent as Intent) : service ? (service.slug === "ai-coaching" ? "coaching" : "paid-work") : "hello";
  const project = projects.find((p) => p.slug === q.project)?.slug;
  return (
    <div className="studio-wrap" style={{ paddingBottom: 90 }}>
      <header className="j-page-head">
        <p className="eyebrow">Connect</p>
        <h1 className="display">Say hello</h1>
        <p className="lede">Tell me what brought you here. I read every message and reply by email. If you'd rather skip the form, write to <a className="j-link" href={`mailto:${site.email}`}>{site.email}</a>.</p>
      </header>
      <div className="j-wrap-narrow" style={{ marginInline: 0 }}>
        <ConnectForm initialIntent={intent} initialService={service?.slug} initialProject={project} projects={projects} />
      </div>
    </div>
  );
}
