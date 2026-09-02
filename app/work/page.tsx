import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Pipeline CRM for Don Howard Construction/Painting — a live Next.js PWA that replaced Invoice2Go.",
};

export default function WorkPage() {
  return (
    <article className="max-w-3xl space-y-8">
      <p className="stamp">Selected work</p>
      <h1 className="display text-4xl sm:text-5xl">Pipeline CRM</h1>
      <p className="text-lg leading-relaxed text-[var(--color-ink-soft)]">
        Built for Don Howard Construction / Painting. Live at{" "}
        <a href={site.pipelineUrl} className="text-[var(--color-rust)] underline underline-offset-4">
          pl.donhowardconstruction.com
        </a>
        .
      </p>
      <div className="hairline" />
      <section className="space-y-4 leading-relaxed">
        <h2 className="display text-2xl">What it replaced</h2>
        <p>
          Invoice2Go handled invoices. The shop still needed a single place for leads,
          estimates, deposits, job status, and talking to the crew. Pipeline is that
          place: a Next.js progressive web app used on phones and in the office.
        </p>
        <h2 className="display text-2xl">What it does</h2>
        <ul className="list-disc space-y-2 pl-5 text-[var(--color-ink-soft)]">
          <li>Leads — capture the job before it is an estimate.</li>
          <li>Estimates — line items the customer can actually read.</li>
          <li>Invoices — generated from the work, not retyped.</li>
          <li>Deposits and payments — recorded against the job.</li>
          <li>Jobs — status and history without a second spreadsheet.</li>
          <li>Crew radio — a simple channel so the field is not a black box.</li>
        </ul>
        <h2 className="display text-2xl">Why it matters</h2>
        <p>
          Trade shops do not need another SaaS login. They need software that matches
          how money and labor actually move. Pipeline is the proof I can build that
          kind of system and keep it in production.
        </p>
      </section>
      <p>
        <Link href="/contact?service=custom-ops-app" className="text-[var(--color-rust)] underline underline-offset-4">
          Request a custom ops app →
        </Link>
      </p>
    </article>
  );
}
