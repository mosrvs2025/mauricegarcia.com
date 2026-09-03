import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
};

export default function HomePage() {
  return (
    <div>
      <section className="relative min-h-[92vh] overflow-hidden">
        <img
          src={site.photo}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_20%] opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-void)] via-[rgba(7,6,5,0.55)] to-[rgba(7,6,5,0.25)]" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28">
          <p className="stamp">Independent engineer · California</p>
          <h1 className="display mt-5 max-w-4xl text-5xl leading-[0.92] sm:text-7xl lg:text-8xl">
            Software for shops still writing estimates on paper.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-paper)]">
            I am Maurice Garcia. I build ops software crews actually use in a truck,
            not a pitch deck.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/work" className="btn btn-fill">See the work</Link>
            <Link href="/contact" className="btn btn-ghost">Start a conversation</Link>
          </div>
        </div>
      </section>

      <div className="marquee">
        <div className="marquee-track">
          Estimates · Invoices · Deposits · Jobs · Crew radio · Pipeline · Estimates · Invoices · Deposits · Jobs · Crew radio · Pipeline ·
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-24 md:grid-cols-2">
        <div>
          <p className="stamp">Flagship</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">Pipeline CRM</h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--color-ink-soft)]">
            A live Next.js PWA for Don Howard Construction / Painting. It replaced
            Invoice2Go for leads, estimates, invoices, deposits, jobs, and walkie radio.
          </p>
          <p className="mt-6">
            <a href={site.pipelineUrl} className="text-[var(--color-rust)] underline underline-offset-4">
              pl.donhowardconstruction.com
            </a>
          </p>
        </div>
        <div className="border border-[var(--color-rule)] p-8">
          <p className="stamp">How I work</p>
          <ul className="mt-6 space-y-4 text-[var(--color-ink-soft)]">
            <li>Talk to the people doing the job, then model the work.</li>
            <li>Ship a usable slice before expanding the map.</li>
            <li>Keep the stack boring: Next.js, TypeScript, a database you can backup.</li>
            <li>No fake metrics. It is in production or it is not.</li>
          </ul>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-[var(--color-rule)]">
        <img src="/promo/workshop-still.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-2">
          <div>
            <p className="stamp">Also: video ads</p>
            <h2 className="display mt-4 text-4xl sm:text-5xl">$1,000 a month to stay on the feed.</h2>
            <p className="mt-4 text-[var(--color-ink-soft)]">
              One-off spots, a monthly cadence, or a launch pack. Built for Chesapeake
              shops that are not painting, decks, or pressure washing.
            </p>
            <Link href="/ads" className="btn btn-fill mt-8">See ad packages</Link>
          </div>
          <img src="/promo/monthly-ads.jpg" alt="Monthly video ads, one thousand dollars" className="w-full object-cover" />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-24 sm:grid-cols-3">
        {[
          { href: "/ads", k: "01 Ads", t: "Video ads for local shops. From $750." },
          { href: "/services", k: "02 Software", t: "Ops apps. Published prices." },
          { href: "/contact", k: "03 Write", t: "hello@mauricegarcia.com" },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group border border-[var(--color-rule)] p-6 transition hover:border-[var(--color-rust)]"
          >
            <p className="stamp">{c.k}</p>
            <p className="display mt-4 text-2xl group-hover:text-white">{c.t}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
