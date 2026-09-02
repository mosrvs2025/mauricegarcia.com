import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
};

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 pt-6 md:grid-cols-[1.2fr_minmax(0,280px)]">
        <div>
          <p className="stamp">Independent engineer · California</p>
          <h1 className="display mt-4 text-4xl leading-tight sm:text-6xl">
            Software for shops that still write estimates on paper.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
            I am Maurice Garcia, a full-stack engineer. I build operations software for
            small businesses — the kind that has to work on a phone in a truck, not just
            on a pitch deck.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/work"
              className="bg-[var(--color-ink)] px-5 py-3 text-sm text-[var(--color-paper)]"
            >
              See the work
            </Link>
            <Link
              href="/contact"
              className="border border-[var(--color-ink)] px-5 py-3 text-sm"
            >
              Start a conversation
            </Link>
          </div>
        </div>
        <img
          src={site.photo}
          alt="Maurice Garcia"
          className="w-full max-w-xs justify-self-start border border-[var(--color-rule)] object-cover aspect-square md:justify-self-end"
        />
      </section>

      <div className="hairline" />

      <section className="grid gap-10 md:grid-cols-2">
        <div>
          <p className="stamp">Flagship</p>
          <h2 className="display mt-3 text-3xl">Pipeline CRM</h2>
          <p className="mt-4 leading-relaxed text-[var(--color-ink-soft)]">
            A live Next.js PWA for Don Howard Construction / Painting. It replaced
            Invoice2Go for leads, estimates, invoices, deposits and payments, jobs,
            and crew radio.
          </p>
          <p className="mt-4">
            <a
              href={site.pipelineUrl}
              className="text-[var(--color-rust)] underline decoration-[var(--color-rule)] underline-offset-4"
            >
              pl.donhowardconstruction.com
            </a>
          </p>
        </div>
        <div className="border border-[var(--color-rule)] bg-[var(--color-paper-2)]/50 p-6">
          <p className="stamp">How I work</p>
          <ul className="mt-4 space-y-3 text-[var(--color-ink-soft)]">
            <li>Talk to the people doing the job, then model the work.</li>
            <li>Ship a usable slice before expanding the map.</li>
            <li>Keep the stack boring: Next.js, TypeScript, a database you can backup.</li>
            <li>No fake metrics. The product is either in production or it is not.</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          { href: "/services", k: "Hire", t: "Fixed scopes, clear prices." },
          { href: "/shop", k: "Read", t: "Short PDFs for owners leaving generic invoicing tools." },
          { href: "/contact", k: "Write", t: "hello@mauricegarcia.com" },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="border border-[var(--color-rule)] p-5 hover:border-[var(--color-ink)]"
          >
            <p className="stamp">{c.k}</p>
            <p className="mt-3 leading-relaxed">{c.t}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
