import Link from "next/link";

const links = [
  { href: "/work", label: "Work" },
  { href: "/ads", label: "Ads" },
  { href: "/services", label: "Services" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-rule)] bg-[rgba(7,6,5,0.72)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="display text-lg tracking-tight sm:text-xl">
          Maurice Garcia
        </Link>
        <nav className="flex flex-wrap justify-end gap-x-5 gap-y-2 text-xs uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[var(--color-ink)]">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
