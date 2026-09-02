import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Custom ops apps from $8,000, two-week product sprints for $4,500, and advisory retainers at $2,000/month.",
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-5 py-16">
      <header className="max-w-2xl">
        <p className="stamp">Services</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">Clear scopes. Published prices.</h1>
        <p className="mt-4 text-lg text-[var(--color-ink-soft)]">
          Independent work for small businesses. If the fit is wrong I will say so
          before you spend money.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-3">
        {services.map((s) => (
          <article key={s.slug} className="flex flex-col border border-[var(--color-rule)] p-7">
            <p className="stamp">{s.price}</p>
            <h2 className="display mt-4 text-3xl">{s.name}</h2>
            <p className="mt-4 flex-1 leading-relaxed text-[var(--color-ink-soft)]">{s.summary}</p>
            <ul className="mt-5 space-y-2 text-sm text-[var(--color-ink-soft)]">
              {s.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <Link href={`/contact?service=${s.slug}`} className="btn btn-fill mt-8 self-start">
              Request this
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
