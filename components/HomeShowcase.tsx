"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ProjectCard } from "@/lib/content/cards";
import { PreviewMedia } from "./PreviewMedia";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Shared semantic hero project showcase across all identities and classic skins.
 * - Softworks (`open-case`): asymmetrical 3-module raised ceramic stack on desktop; horizontal module rail on mobile.
 * - Mercury (`rogue-instrument`): full-width cinematic metallic product showcase.
 * - Parallax (`unauthorized-manual`): back dimmed visual plane + offset frosted middle metadata plane.
 * - Classic skins: original interactive single-frame project viewer.
 */
export function HomeShowcase({ projects }: { projects: ProjectCard[] }) {
  const [selected, setSelected] = useState(0);
  const p = projects[selected];
  if (!p) return null;

  return (
    <div className="home-showcase" aria-label="Featured project previews">
      {/* Primary stage (used by Classic, Mercury wide showcase, and Parallax Back plane) */}
      <div className="showcase-stage" data-card key={p.slug}>
        <div className="showcase-chrome" data-float-clear>
          <span><i /> Selected work</span>
          <span className="j-num">{pad(selected + 1)} / {pad(projects.length)}</span>
        </div>
        <Link className="showcase-screen" href={`/projects/${p.slug}`} aria-label={`Explore ${p.title}`}>
          <PreviewMedia title={p.title} image={p.image} preview={p.preview} sizes="(max-width:900px) 100vw, 58vw" priority />
          <span className="showcase-view">Explore project ↗</span>
        </Link>
      </div>

      {/* Supporting metadata & manual selector (used by Classic, Mercury rail, and Parallax Middle frosted plane) */}
      <div className="showcase-info j-surface">
        <div className="showcase-caption" aria-live="polite" aria-atomic="true">
          <div>
            <p className="eyebrow">{p.track} / {p.stateLabel}</p>
            <h2 className="display"><Link href={`/projects/${p.slug}`}>{p.title}</Link></h2>
            {p.tagline && <p className="showcase-tagline">{p.tagline}</p>}
          </div>
          {p.demo && (
            <a className="showcase-launch" href={p.demo} aria-label={`Open ${p.title} live demo`} data-track="demo_visit" data-track-project={p.slug}>
              Try it live ↗
            </a>
          )}
        </div>
        <div className="showcase-selector" data-float-clear role="group" aria-label="Choose a project preview">
          {projects.map((project, i) => (
            <button
              key={project.slug}
              type="button"
              className="j-pressable"
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <span className="j-num">{pad(i + 1)}</span>
              <span className="showcase-sel-name">{project.title}</span>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
        <p className="showcase-note">Actual project captures.</p>
      </div>

      {/* Asymmetrical 3-module tactile stack (displayed in Softworks desktop & mobile horizontal rail) */}
      <div className="showcase-modules" aria-label="Selected project modules">
        <div className="showcase-modules-head">
          <span className="eyebrow j-inset">Selected work</span>
          <span className="j-num showcase-modules-count">{pad(selected + 1)} / {pad(projects.length)}</span>
        </div>
        <ol className="showcase-module-list">
          {projects.map((project, i) => {
            const featured = i === 1;
            return (
              <li key={project.slug} className={`showcase-module j-surface j-pressable${featured ? " is-featured" : ""}`}>
                <Link href={`/projects/${project.slug}`} className="showcase-module-link" onFocus={() => setSelected(i)} onMouseEnter={() => setSelected(i)}>
                  <div className="showcase-module-frame j-inset">
                    {project.image ? (
                      <Image
                        src={project.image.src}
                        alt={project.image.alt}
                        fill
                        sizes={featured ? "(max-width:900px) 78vw, 34vw" : "(max-width:900px) 72vw, 24vw"}
                        loading={i === 0 ? "eager" : "lazy"}
                      />
                    ) : (
                      <span className="j-tile-letter" aria-hidden="true">{project.title[0]}</span>
                    )}
                  </div>
                  <div className="showcase-module-meta">
                    <span className="showcase-module-top">
                      <span className="j-num">{pad(i + 1)}</span>
                      <span className="showcase-module-state">{project.track} · {project.stateLabel}</span>
                    </span>
                    <strong className="display">{project.title}</strong>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
