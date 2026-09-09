"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
const links = [{ href: "/work", label: "Work" },{ href: "/services", label: "Services" },{ href: "/coaching", label: "Coaching" },{ href: "/ai-receptionist", label: "AI receptionist" },{ href: "/about", label: "About" }];
export function Header() {
 const [open,setOpen] = useState(false);
 const pathname = usePathname();
 return <header className="site-header"><div className="studio-wrap nav-bar"><Link href="/" onClick={()=>setOpen(false)} className="brand" aria-label="Maurice Garcia home"><span className="brand-mark">mg<span>✳</span></span><span className="brand-name">MAURICE<br/>GARCIA</span></Link><nav className="desktop-nav" aria-label="Main navigation">{links.map(l=><Link key={l.href} href={l.href} aria-current={pathname===l.href?'page':undefined}>{l.label}</Link>)}</nav><Link href="/contact" className="nav-cta">Let’s talk ↗</Link><button aria-expanded={open} aria-controls="mobile-menu" className="menu-toggle" onClick={()=>setOpen(!open)}>{open ? "Close −" : "Menu +"}</button></div>{open && <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile navigation">{[...links,{href:"/contact",label:"Start a project"}].map(l=><Link href={l.href} key={l.href} onClick={()=>setOpen(false)}>{l.label}<span>↗</span></Link>)}</nav>}</header>;
}


