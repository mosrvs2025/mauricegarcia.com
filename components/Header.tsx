"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import { ContactSplitControl } from "./ContactActions";
import { InstagramPortrait } from "./InstagramPortrait";
import { SkinPicker, SkinRuntime } from "./SkinPicker";

const links: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/projects",
    label: "Projects",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: "/learn",
    label: "Learn",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 4.2c1.6-.9 3.6-.9 5.5 0v8.5c-1.9-.9-3.9-.9-5.5 0V4.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M13.5 4.2c-1.6-.9-3.6-.9-5.5 0v8.5c1.9-.9 3.9-.9 5.5 0V4.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/updates",
    label: "Updates",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.8V8l2.2 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/writing",
    label: "Writing",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 12.8h10M4 9.5 10.6 3l2.4 2.4L6.4 11.9 3.5 12.4 4 9.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/about",
    label: "About",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.2 13.2c.9-2.3 2.7-3.4 4.8-3.4s3.9 1.1 4.8 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/services",
    label: "Work with me",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 5.5h11v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M5.8 5.5V4a1.2 1.2 0 0 1 1.2-1.2h2A1.2 1.2 0 0 1 10.2 4v1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
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
      <SkinRuntime />
      <div className="studio-wrap nav-bar">
        <div className="brand-cluster">
          <InstagramPortrait size="nav" />
          <Link href="/" className="brand" aria-label="Maurice Garcia, home">
            <span className="brand-mark" aria-hidden="true">mg<span className="bm-star">✳</span><i className="bm-dot" /></span>
            <span className="brand-name">MAURICE<br />GARCIA</span>
          </Link>
        </div>
        <nav className="desktop-nav" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={current(l.href)} className="nav-item j-pressable">
              <span className="nav-ic" aria-hidden="true">{l.icon}</span>
              <span className="nav-txt">{l.label}</span>
            </Link>
          ))}
        </nav>
        <div className="nav-utilities">
          <div className="skin-desktop"><SkinPicker /></div>
          <div className="nav-contact-desktop"><ContactSplitControl email={site.email} variant="nav" /></div>
          <Link href="/connect" className="nav-cta j-pressable" aria-current={current("/connect")}>Say hello</Link>
        </div>
        <button ref={toggle} type="button" aria-expanded={open} aria-controls="mobile-menu" className="menu-toggle j-pressable" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile">
          {[...links, { href: "/connect", label: "Say hello", icon: null }].map((l) => (
            <Link href={l.href} key={l.href} aria-current={current(l.href)}>{l.label}<span aria-hidden="true">→</span></Link>
          ))}
          <SkinPicker mobile />
        </nav>
      )}
    </header>
  );
}
