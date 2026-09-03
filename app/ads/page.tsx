import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Video ads",
  description:
    "Video ads for local shops: one-off spots from $750, monthly ads at $1,000, and a $2,500 launch pack.",
};

const packs = services.filter((s) => s.kind === "video");

export default function AdsPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <img
          src="/promo/monthly-ads.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-void)] via-[rgba(7,6,5,0.7)] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5 py-24">
          <p className="stamp">Video ads</p>
          <h1 className="display mt-4 max-w-3xl text-5xl sm:text-7xl">
            Ads local shops can actually run.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[var(--color-ink-soft)]">
            Short spots for Reels, Shorts, and Facebook. I do not take Chesapeake
            painting, deck, or pressure-washing competitors.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-16 lg:grid-cols-3">
        {packs.map((s) => (
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
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-24 md:grid-cols-2">
        <img src="/promo/workshop-still.jpg" alt="Workshop still for a local business ad" className="w-full object-cover" />
        <img src="/promo/one-ad.jpg" alt="One ad package graphic" className="w-full object-cover" />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <p className="stamp">Samples</p>
        <h2 className="display mt-3 text-4xl">Work I have already cut.</h2>
        <p className="mt-4 max-w-2xl text-[var(--color-ink-soft)]">
          Send YouTube, Instagram, or Don Howard page links and they go here as
          embeds. Packages are live now so a shop can book without waiting.
        </p>
        <Link href="/contact?service=video-monthly" className="btn btn-ghost mt-8">
          Send a brief
        </Link>
      </section>
    </div>
  );
}
