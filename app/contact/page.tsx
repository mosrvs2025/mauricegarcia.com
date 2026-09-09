import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { connection } from "next/server";
import { serviceBySlug } from "@/lib/services";
export const metadata: Metadata = { title: "Start a project", description: "Ask Maurice Garcia about websites, AI services, or practical one-to-one coaching." };
export default async function ContactPage({searchParams}:{searchParams:Promise<{service?:string}>}) {
 await connection();
 const {service}=await searchParams; const known=serviceBySlug(service);
 return <div className="studio-wrap contact-layout"><header><p className="eyebrow">Your idea starts here</p><h1 className="display">Let’s make<br/>your next<br/><em>move.</em></h1><p>Tell me about your project or what you want to learn. I’ll review the brief and get back to you with the next steps.</p><a href="mailto:hello@mauricegarcia.com" className="text-link">hello@mauricegarcia.com ↗</a><div className="contact-note"><span>01 / A short conversation</span><span>02 / A clear proposal</span><span>03 / Your next step</span></div></header><section className="contact-panel">{known && <p className="selected-service">Let’s talk about: {known.name}</p>}<ContactForm initialService={known?.slug}/></section></div>;
}


