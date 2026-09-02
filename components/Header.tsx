import Link from "next/link";

const links = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="border-b border-[var(--color-rule)]">
      <div className="mx-auto flex max-w-5xl items-baseline justify-between gap-6 px-5 py-6">
        <Link href="/" className="display text-xl tracking-tight">
          Maurice Garcia
        </Link>
        <nav className="flex flex-wrap justify-end gap-x-5 gap-y-2 text-sm text-[var(--color-ink-soft)]">
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
