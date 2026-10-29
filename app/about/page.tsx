import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { capabilities } from "@/lib/capabilities";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Maurice Garcia is an Experience Engineer, creative technologist and independent builder working across AI, software, automation, interactive experiences, games, Android and experimental technology.",
};

const photos = [
  { src: "/images/maurice-beard.jpg", alt: "Maurice outdoors" },
  { src: "/images/maurice-chalkboard.jpg", alt: "Maurice in front of a chalkboard" },
];

export default function AboutPage() {
  return (
    <div className="studio-wrap">
      <header className="j-page-head"><p className="eyebrow">About</p><h1 className="display">An Experience Engineer, building across the stack of ideas</h1></header>
      <section className="j-section" style={{ paddingTop: 24 }}>
        <div className="j-about">
          <Image src={site.photo} alt="Maurice Garcia, outdoor portrait" width={600} height={750} sizes="(max-width:760px) 80vw, 360px" priority />
          <div className="j-prose">
            <p>I&apos;m Maurice Garcia: an Experience Engineer, creative technologist and independent builder. I work across AI, software, automation, interactive experiences, games, Android and experimental technology, and the through-line is turning ambitious ideas into things that actually run.</p>
            <p>That means two kinds of work side by side. Practical products with a clear user and a business case, and experiments, games and worlds built to see what&apos;s possible. Each one teaches me something the other can&apos;t. The <Link href="/projects">projects page</Link> shows both, and says honestly how finished each one is.</p>
            <h2>Where this is going</h2>
            <p>My long-term focus is building products that scale, not selling hours. Along the way I take on custom builds, consulting and teaching, and I&apos;m open to licensing, partnerships and backing for the products I&apos;m building.</p>
            <h2>How I work</h2>
            <p>I use several AI models, tools and workflows and pick what fits the job. I build with AI coding assistants and say so: where the commit history shows Claude as a co-author, the project page says that too. Writing under my name is written by me. I agree scope and a custom quote before work starts, and I&apos;d rather say &quot;I don&apos;t know yet&quot; than invent a résumé.</p>
            <h2>What I work across</h2>
            <ul>{capabilities.map((c) => <li key={c.id}><strong>{c.title}.</strong> {c.line}</li>)}</ul>
            <h2>Who I&apos;d like to hear from</h2>
            <ul>
              <li>Companies and founders with an ambitious idea that needs to become a working product.</li>
              <li>Teams that need custom software, automation or AI integrated into how they work.</li>
              <li>Partners and investors interested in my original products.</li>
              <li>Anyone who wants to learn to build with AI, whatever their experience.</li>
              <li>Recruiters and technology teams looking for creative engineering talent.</li>
            </ul>
            <p className="j-actions"><Link className="btn btn-fill" href="/services">Work with me</Link><Link className="btn btn-ghost" href="/connect">Say hello</Link></p>
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
