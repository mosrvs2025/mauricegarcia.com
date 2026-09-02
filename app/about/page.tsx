import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Maurice Garcia is a full-stack engineer in California who builds software for small businesses.",
};

export default function AboutPage() {
  return (
    <article className="max-w-2xl space-y-6">
      <p className="stamp">About</p>
      <h1 className="display text-4xl sm:text-5xl">A workshop, not an agency.</h1>
      <p className="text-lg leading-relaxed text-[var(--color-ink-soft)]">
        I am Maurice Garcia, a full-stack engineer based in California. I build
        software for small businesses — especially shops that live on estimates,
        invoices, and job sites.
      </p>
      <p className="leading-relaxed">
        Most of my time goes into products like Pipeline CRM: one system that
        replaces a pile of apps and spreadsheets. I write TypeScript, ship Next.js
        apps, and stay close to the people who will actually use the thing.
      </p>
      <p className="leading-relaxed">
        I work independently. You talk to me. Code lives in git. I do not invent
        résumés or awards. If you want to see the work, it is live.
      </p>
      <p>
        GitHub:{" "}
        <a href={site.github} className="text-[var(--color-rust)] underline underline-offset-4">
          {site.githubHandle}
        </a>
      </p>
    </article>
  );
}
