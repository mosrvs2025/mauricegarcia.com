import Link from "next/link";
import { linkedInUrl, site } from "@/lib/site";

export function Footer() {
  const linkedin = linkedInUrl();
  return (
    <footer className="border-t border-[var(--color-rule)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-[var(--color-ink-soft)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="display text-2xl text-[var(--color-ink)]">MG</p>
          <p className="mt-2">© 2026 Maurice Garcia · California</p>
        </div>
        <p className="flex flex-wrap gap-x-5 gap-y-2 uppercase tracking-[0.14em] text-xs">
          <a href={site.github} className="hover:text-[var(--color-ink)]">GitHub</a>
          <a href={site.instagram} className="hover:text-[var(--color-ink)]">Instagram</a>
          {linkedin ? (
            <a href={linkedin} className="hover:text-[var(--color-ink)]">LinkedIn</a>
          ) : null}
          <a href={`mailto:${site.email}`} className="hover:text-[var(--color-ink)]">{site.email}</a>
          <Link href="/contact" className="hover:text-[var(--color-ink)]">Contact</Link>
        </p>
      </div>
    </footer>
  );
}
