"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/projects", label: "Projects" },
  { href: "/writing", label: "Writing" },
  { href: "/updates", label: "Updates" },
  { href: "/now", label: "Now" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Work with me" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const current = (href: string) => (pathname === href || pathname.startsWith(href + "/") ? "page" : undefined);
  return (
    <header className="site-header">
      <div className="studio-wrap nav-bar">
        <Link href="/" className="brand" aria-label="Maurice Garcia, home">
          <span className="brand-mark" aria-hidden="true">mg<span>✳</span></span>
          <span className="brand-name">MAURICE<br />GARCIA</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main">
          {links.map((l) => <Link key={l.href} href={l.href} aria-current={current(l.href)}>{l.label}</Link>)}
        </nav>
        <Link href="/connect" className="nav-cta">Say hello</Link>
        <button ref={toggle} type="button" aria-expanded={open} aria-controls="mobile-menu" className="menu-toggle" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile">
          {[...links, { href: "/connect", label: "Say hello" }].map((l) => (
            <Link href={l.href} key={l.href} aria-current={current(l.href)}>{l.label}<span aria-hidden="true">→</span></Link>
          ))}
        </nav>
      )}
    </header>
  );
}
