import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About", description: "Maurice Garcia is a full-stack engineer who builds software for small businesses, plus games and experiments for the fun of it." };

const photos = [
  { src: "/images/maurice-beard.jpg", alt: "Maurice outdoors" },
  { src: "/images/maurice-chalkboard.jpg", alt: "Maurice in front of a chalkboard" },
];

export default function AboutPage() {
  return (
    <div className="studio-wrap">
      <header className="j-page-head"><p className="eyebrow">About</p><h1 className="display">A workshop, not an agency.</h1></header>
      <section className="j-section" style={{ paddingTop: 24 }}>
        <div className="j-about">
          <Image src={site.photo} alt="Maurice Garcia, outdoor portrait" width={600} height={750} sizes="(max-width:760px) 80vw, 360px" priority />
          <div className="j-prose">
            <p>I'm Maurice Garcia, a full-stack engineer. My day-to-day work is software for small businesses, especially shops that live on estimates, invoices and job sites. I write TypeScript, ship Next.js apps, and stay close to the people who will use the thing.</p>
            <p>Alongside that I make games, creative tools and odd experiments, and I put them on the web so people can try them. You can see the real state of each on the <Link href="/projects">projects page</Link>, including what's unfinished.</p>
            <h2>How I work</h2>
            <p>You talk to me. Code lives in Git. I agree scope and price before work starts, and I'd rather say "I don't know yet" than invent a résumé.</p>
            <p>I build with AI coding assistants, and I say so. Where the commit history shows Claude as a co-author, the project page says that too. Writing under my name is written by me.</p>
            <h2>Who I'd like to hear from</h2>
            <ul>
              <li>Builders and designers who'd enjoy making something small and strange together.</li>
              <li>People who played a demo and have an opinion about it.</li>
              <li>Trade shops and small businesses that need a site or a custom tool.</li>
              <li>Anyone learning to build with AI tools who wants a working session on a real idea.</li>
            </ul>
            <p className="j-actions"><Link className="btn btn-fill" href="/connect">Say hello</Link><Link className="j-link j-arrow" href="/services">Work with me</Link></p>
            <p className="j-muted" style={{ fontSize: ".95rem" }}><a className="j-link" href={site.github}>GitHub: {site.githubHandle}</a> · <a className="j-link" href={site.instagram}>Instagram: @{site.instagramHandle}</a></p>
          </div>
        </div>
      </section>
      <section className="j-section" aria-label="More photos">
        <div className="j-photos">
          {photos.map((ph) => <Image key={ph.src} src={ph.src} alt={ph.alt} width={600} height={800} sizes="(max-width:760px) 45vw, 30vw" loading="lazy" />)}
        </div>
      </section>
    </div>
  );
}
