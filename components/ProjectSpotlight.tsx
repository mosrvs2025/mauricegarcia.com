import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Project } from "@/lib/content/schemas";
import { MATURITY_LABELS, TRACK_LABELS } from "@/lib/content/query";
import { Reveal } from "./Reveal";

/** First words of a screenshot caption ("Footprint: what your phone knows (a sample week)." becomes "Footprint"). */
const shortLabel = (caption?: string) => (caption ?? "").split(/[:.(]/)[0].trim();

/**
 * A larger home-page feature for one project: its lead copy, a few verified facts, and its own screenshots in a
 * sideways-scrolling strip (the images are portrait phone screens, so a 16:9 card would crop them). Everything
 * shown comes from the project's content file; nothing here is typed in separately except the short "what's inside" list.
 */
export function ProjectSpotlight({ project: p, eyebrow, headline, inside, privacyNote, number, notes }: {
  project: Project; eyebrow: string; headline: string; inside: string[]; privacyNote: string;
  /** Case-file number ("01"): shown in the margin of the editorial identities. */
  number?: string;
  /** CaseAnnotation notes about this project (real engineering decisions and limitations). */
  notes?: ReactNode;
}) {
  const shots = p.media.filter((m) => (m.height ?? 0) > (m.width ?? 1));
  const release = p.links.other[0];
  return (
    <section className="studio-wrap j-section us cf cf-spread" aria-labelledby="us-h">
      <Reveal>
        <div className="us-grid j-surface">
          <div className="us-copy">
            <p className="eyebrow">{number && <span className="cf-no">File {number}</span>}{eyebrow} · {TRACK_LABELS[p.track].title}</p>
            <h2 className="display" id="us-h">{headline}</h2>
            <p className="lede">{p.tagline}</p>
            <ul className="us-chips" aria-label="What is inside">{inside.map((t) => <li key={t}>{t}</li>)}</ul>
            <p className="us-note"><span className="j-tag state">{MATURITY_LABELS[p.maturity]}</span> {privacyNote}</p>
            {notes && <div className="cf-notes" role="group" aria-label={`Notes on ${p.title}`}>{notes}</div>}
            <div className="j-actions">
              <Link className="btn btn-fill j-shine j-pressable" href={`/projects/${p.slug}`}>Read the case study <span aria-hidden="true">→</span></Link>
              {release && <a className="btn btn-ghost j-pressable" href={release.url} rel="noopener noreferrer" data-track="outbound_click" data-track-project={p.slug}>{release.label} <span aria-hidden="true">↗</span></a>}
              {p.links.repo && <a className="j-link j-arrow" href={p.links.repo} rel="noopener noreferrer" data-track="source_click" data-track-project={p.slug}>Source on GitHub</a>}
            </div>
          </div>
          {shots.length > 0 && (
            <div className="us-shots" role="region" aria-label={`${p.title} screens. Scroll sideways to see more.`} tabIndex={0}>
              <ul>
                {shots.map((m) => (
                  <li key={m.src}>
                    <figure>
                      <Image src={m.src} alt={m.alt} width={m.width ?? 616} height={m.height ?? 1336} sizes="(max-width:760px) 44vw, 210px" loading="lazy" />
                      <figcaption>{shortLabel(m.caption)}</figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
