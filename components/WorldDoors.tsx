import Image from "next/image";
import Link from "next/link";
import type { ProjectCard } from "@/lib/content/cards";
import { TRACK_LABELS } from "@/lib/content/query";
import { Reveal } from "./Reveal";

type World = { track: "experiences" | "products" | "labs"; lead: string; total: number; projects: ProjectCard[] };

/** Three doors into the portfolio. Each shows work the hero didn't, so nothing repeats on the way down. */
export function WorldDoors({ worlds }: { worlds: World[] }) {
  return (
    <section className="studio-wrap j-section" aria-labelledby="worlds-h">
      <Reveal><div className="j-head"><div><p className="eyebrow">The work</p><h2 className="display" id="worlds-h">Three worlds. Pick a door.</h2></div><Link href="/projects" className="j-link j-arrow">Browse everything</Link></div></Reveal>
      <div className="wd-grid">
        {worlds.map((w, i) => {
          const t = TRACK_LABELS[w.track];
          const shots = w.projects.filter((p) => p.image).slice(0, 3);
          return (
            <Reveal key={w.track} delay={i * 90} className={`wd-door wd-${w.track}`}>
              <Link href={`/projects?track=${w.track}`} id={w.track} className="wd-link" aria-label={`${t.title}: ${w.total} projects`}>
                <div className="wd-stack" aria-hidden="true">
                  {shots.map((p, k) => <div key={p.slug} className="wd-shot" style={{ ["--k" as string]: k }}><Image src={p.image!.src} alt="" fill sizes="(max-width:900px) 80vw, 30vw" /></div>)}
                </div>
                <div className="wd-body">
                  <p className="wd-num">0{i + 1} <span>· {w.total} projects</span></p>
                  <h3 className="display">{t.title}</h3>
                  <p className="wd-lead">{w.lead}</p>
                  <p className="wd-names">{w.projects.slice(0, 4).map((p) => p.title).join(" · ")}</p>
                  <span className="wd-go">Enter {t.title.toLowerCase()} <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
