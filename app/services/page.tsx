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
    <div className="space-y-10">
      <header className="max-w-2xl">
        <p className="stamp">Services</p>
        <h1 className="display mt-3 text-4xl sm:text-5xl">Clear scopes. Published prices.</h1>
        <p className="mt-4 text-lg text-[var(--color-ink-soft)]">
          Independent work for small businesses. If the fit is wrong I will say so
          before you spend money.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        {services.map((s) => (
          <article key={s.slug} className="flex flex-col border border-[var(--color-rule)] p-6">
            <p className="stamp">{s.price}</p>
            <h2 className="display mt-3 text-2xl">{s.name}</h2>
            <p className="mt-3 flex-1 leading-relaxed text-[var(--color-ink-soft)]">{s.summary}</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-soft)]">
              {s.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <Link
              href={`/contact?service=${s.slug}`}
              className="mt-6 inline-block bg-[var(--color-rust)] px-4 py-2 text-sm text-[var(--color-paper)]"
            >
              Request this
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
