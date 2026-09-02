import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Maurice Garcia is a full-stack engineer in California who builds software for small businesses.",
};

const extraPhotos = [
  { src: "/images/maurice-beard.jpg", alt: "Maurice outdoors" },
  { src: "/images/maurice-chalkboard.jpg", alt: "Maurice in front of a chalkboard" },
];

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-6xl px-5 py-16">
      <p className="stamp">About</p>
      <div className="mt-8 grid items-end gap-12 lg:grid-cols-[minmax(0,380px)_1fr]">
        <img
          src={site.photo}
          alt="Maurice Garcia, outdoor portrait"
          className="w-full object-cover aspect-[4/5]"
        />
        <div className="space-y-6 pb-2">
          <h1 className="display text-5xl sm:text-6xl">A workshop, not an agency.</h1>
          <p className="text-lg leading-relaxed text-[var(--color-ink-soft)]">
            I am Maurice Garcia, a full-stack engineer based in California. I build
            software for small businesses — especially shops that live on estimates,
            invoices, and job sites.
          </p>
          <p className="leading-relaxed text-[var(--color-ink-soft)]">
            Most of my time goes into products like Pipeline CRM: one system that
            replaces a pile of apps and spreadsheets. I write TypeScript, ship Next.js
            apps, and stay close to the people who will actually use the thing.
          </p>
          <p className="leading-relaxed">
            You talk to me. Code lives in git. I do not invent résumés. If you want
            to see the work, it is live.
          </p>
          <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
            <a href={site.instagram} className="hover:text-[var(--color-ink)]">@{site.instagramHandle}</a>
            {" · "}
            <a href={site.github} className="hover:text-[var(--color-ink)]">{site.githubHandle}</a>
          </p>
        </div>
      </div>
      <section className="mt-20">
        <p className="stamp">From Instagram</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <img src={site.photo} alt="Maurice Garcia" className="aspect-[3/4] w-full object-cover" />
          {extraPhotos.map((photo) => (
            <img key={photo.src} src={photo.src} alt={photo.alt} className="aspect-[3/4] w-full object-cover" />
          ))}
        </div>
      </section>
    </article>
  );
}
