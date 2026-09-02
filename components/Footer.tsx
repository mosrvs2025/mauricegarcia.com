import Link from "next/link";
import { linkedInUrl, site } from "@/lib/site";

export function Footer() {
  const linkedin = linkedInUrl();
  return (
    <footer className="mt-24 border-t border-[var(--color-rule)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-8 text-sm text-[var(--color-ink-soft)] sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Maurice Garcia</p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <a href={site.github} className="hover:text-[var(--color-ink)]">
            GitHub
          </a>
          <a href={site.instagram} className="hover:text-[var(--color-ink)]">
            Instagram
          </a>
          {linkedin ? (
            <a href={linkedin} className="hover:text-[var(--color-ink)]">
              LinkedIn
            </a>
          ) : null}
          <a href={`mailto:${site.email}`} className="hover:text-[var(--color-ink)]">
            {site.email}
          </a>
          <Link href="/contact" className="hover:text-[var(--color-ink)]">
            Contact
          </Link>
        </p>
      </div>
    </footer>
  );
}
