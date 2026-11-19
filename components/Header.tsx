"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ContactActions } from "./ContactActions";
import { InstagramPortrait } from "./InstagramPortrait";
import { SkinPicker, SkinRuntime } from "./SkinPicker";

type Icon = "projects" | "products" | "learn" | "updates" | "writing" | "about" | "work" | "hello";
const links: { href: string; label: string; icon: Icon }[] = [
  { href: "/projects", label: "Projects", icon: "projects" },
  { href: "/products", label: "Products", icon: "products" },
  { href: "/learn", label: "Learn", icon: "learn" },
  { href: "/updates", label: "Updates", icon: "updates" },
  { href: "/writing", label: "Writing", icon: "writing" },
  { href: "/about", label: "About", icon: "about" },
  { href: "/services", label: "Work with me", icon: "work" },
];

const PATHS: Record<Icon, string> = {
  projects: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  products: "M6 8.5 12 5l6 3.5v7L12 19l-6-3.5z M12 19V12 M6 8.5 12 12l6-3.5",
  learn: "M3 6.5 12 3l9 3.5-9 3.5z M7 8.6v5.2c0 1.6 2.2 3.2 5 3.2s5-1.6 5-3.2V8.6 M21 6.5V12",
  updates: "M3 12h4l2.5-6 5 12 2.5-6h4",
  writing: "M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4",
  about: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5",
  work: "M3.5 8h17v11h-17z M9 8V5.5h6V8 M3.5 13h17",
  hello: "M4 5h16v11H9l-5 4z",
};
/** Line icons for the SOFTWORKS instrument rail. Decorative: every control also has its visible text label. */
const NavIcon = ({ name }: { name: Icon }) => (
  <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/**
 * One navigation tree for every skin. The identities give it different geometry in CSS (app/identities.css):
 * SOFTWORKS a docked vertical instrument rail, MERCURY a floating chrome capsule with a liquid indicator,
 * PARALLAX a slim floating glass rail. Contact is always in reach: "Say hello" opens /connect, and the Email/Copy
 * shortcuts sit beside it on wide screens (phones get the bottom rail instead).
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const current = (href: string) => (pathname === href || pathname.startsWith(href + "/") ? "page" : undefined);

  // MERCURY's liquid indicator: CSS variables that follow the hovered/focused link and rest on the current page.
  const moveTo = useCallback((el: Element | null) => {
    const n = nav.current; if (!n) return;
    n.dataset.liquid = el ? "on" : "off";
    if (!el) { n.style.setProperty("--liquid-o", "0"); return; }
    const a = el as HTMLElement;
    n.style.setProperty("--liquid-x", `${a.offsetLeft}px`);
    n.style.setProperty("--liquid-w", `${a.offsetWidth}px`);
    n.style.setProperty("--liquid-o", "1");
  }, []);
  const rest = useCallback(() => moveTo(nav.current?.querySelector('a[aria-current="page"]') ?? null), [moveTo]);
  useEffect(() => {
    rest();
    const onResize = () => rest();
    window.addEventListener("resize", onResize); window.addEventListener("mg-skin", onResize);
    document.fonts?.ready.then(rest).catch(() => undefined);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("mg-skin", onResize); };
  }, [pathname, rest]);

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
        <nav ref={nav} className="desktop-nav" aria-label="Main" onMouseLeave={rest} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) rest(); }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={current(l.href)} className="j-pressable" onMouseEnter={(e) => moveTo(e.currentTarget)} onFocus={(e) => moveTo(e.currentTarget)}>
              <NavIcon name={l.icon} /><span className="nav-label">{l.label}</span>
            </Link>
          ))}
          <span className="nav-liquid" aria-hidden="true" />
        </nav>
        <div className="skin-desktop"><SkinPicker /></div>
        <div className="nav-contact">
          <Link href="/connect" className="nav-cta j-pressable" aria-current={current("/connect")}><NavIcon name="hello" /><span className="nav-label">Say hello</span></Link>
          <ContactActions variant="nav" />
        </div>
        <button ref={toggle} type="button" aria-expanded={open} aria-controls="mobile-menu" className="menu-toggle j-pressable" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile">
          {[...links, { href: "/connect", label: "Say hello" }].map((l) => (
            <Link href={l.href} key={l.href} aria-current={current(l.href)}>{l.label}<span aria-hidden="true">→</span></Link>
          ))}
          <SkinPicker mobile />
        </nav>
      )}
    </header>
  );
}
