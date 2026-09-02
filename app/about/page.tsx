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
    <article className="max-w-3xl">
      <p className="stamp">About</p>
      <div className="mt-6 grid items-start gap-10 md:grid-cols-[minmax(0,240px)_1fr]">
        <figure>
          <img
            src={site.photo}
            alt="Maurice Garcia, outdoor portrait"
            className="w-full border border-[var(--color-rule)] object-cover aspect-square"
          />
          <figcaption className="mt-2 text-sm text-[var(--color-ink-soft)]">
            <a href={site.instagram} className="hover:text-[var(--color-ink)]">
              @{site.instagramHandle}
            </a>
          </figcaption>
        </figure>
        <div className="space-y-6">
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
        </div>
      </div>
      <section className="mt-16">
        <p className="stamp">From Instagram</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <img
            src={site.photo}
            alt="Maurice Garcia"
            className="aspect-[3/4] w-full border border-[var(--color-rule)] object-cover"
          />
          {extraPhotos.map((photo) => (
            <img
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              className="aspect-[3/4] w-full border border-[var(--color-rule)] object-cover"
            />
          ))}
        </div>
      </section>
    </article>
  );
}
