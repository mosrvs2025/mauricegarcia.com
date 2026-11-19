import Image from "next/image";
import Link from "next/link";
import type { ProjectCard } from "@/lib/content/cards";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The three lead projects as one ordered list, shared by every identity. The identities arrange it differently
 * (app/identities.css): SOFTWORKS stacks them as raised instrument modules beside the headline (a sideways rail on
 * phones), MERCURY turns the first into a near full-width chrome showcase with the others in an alternating editorial
 * grid, PARALLAX lists them on the frosted middle plane of the hero stage. The classic skins use HomeShowcase instead.
 *
 * Images are lazy: a skin that hides them (PARALLAX, the classic skins) never downloads them.
 */
export function HeroWork({ projects }: { projects: ProjectCard[] }) {
  if (!projects.length) return null;
  return (
    <section className="hero-work" aria-labelledby="hero-work-h">
      <h2 className="hero-work-head eyebrow" id="hero-work-h"><span>Selected work</span><span className="j-num" aria-hidden="true">{pad(projects.length)}</span></h2>
      <ol className="hw-list">
        {projects.map((p, i) => (
          <li key={p.slug} className={`hw-item j-surface${i === 0 ? " hw-lead" : ""}`} data-card>
            {p.image && (
              <figure className="hw-media j-inset">
                <Image src={p.image.src} alt={p.image.alt} width={1280} height={800} sizes={i === 0 ? "(max-width:760px) 82vw, (max-width:1100px) 90vw, 46vw" : "(max-width:760px) 72vw, (max-width:1100px) 44vw, 30vw"} loading="lazy" />
              </figure>
            )}
            <div className="hw-meta">
              <p className="hw-kicker"><span className="j-num">{pad(i + 1)}</span><span>{p.track} · {p.stateLabel}</span></p>
              <h3 className="display hw-title"><Link href={`/projects/${p.slug}`} className="hw-link">{p.title}</Link></h3>
              <p className="hw-line">{p.tagline}</p>
              {p.demo && <a className="hw-demo j-link" href={p.demo} aria-label={`Open ${p.title} live demo`} data-track="demo_visit" data-track-project={p.slug}>Try it live <span aria-hidden="true">↗</span></a>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
