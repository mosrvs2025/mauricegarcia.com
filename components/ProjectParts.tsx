import Image from "next/image";
import Link from "next/link";
import { STATE_LABELS, THEME_LABELS, formatDate } from "@/lib/content/query";
import type { Project, Update } from "@/lib/content/schemas";
import { isProposed } from "@/lib/content/visibility";
import { themeColor } from "@/lib/themes";
import { TiltCard } from "./TiltCard";

export const Proposed = () => <span className="j-proposed">Proposed, awaiting approval</span>;

export function StateTag({ project }: { project: Pick<Project, "state"> }) {
  return <span className="j-tag state">{STATE_LABELS[project.state]}</span>;
}

export function ProjectLead({ project }: { project: Project }) {
  const media = project.media[0];
  return (
    <TiltCard>
    <article className="j-lead" style={{ "--accent": themeColor(project.themes) } as React.CSSProperties}>
      <div className="j-lead-media">
        {media ? <Image src={media.src} alt={media.alt} fill sizes="(max-width:760px) 100vw, 55vw" style={{ objectFit: "cover" }} priority /> : <div className="j-row-thumb empty" style={{ width: "100%", height: "100%", border: 0, fontSize: "4rem" }} aria-hidden="true">{project.title.slice(0, 1)}</div>}
      </div>
      <div className="j-lead-body">
        <div className="j-tags"><StateTag project={project} />{project.themes.map((t) => <span className="j-tag" key={t}>{THEME_LABELS[t]}</span>)}{isProposed(project) && <Proposed />}</div>
        <h3 className="display"><Link href={`/projects/${project.slug}`} className="j-link">{project.title}</Link></h3>
        <p>{project.tagline}</p>
        <p className="j-muted" style={{ fontSize: ".9rem" }}>{project.stateNote}</p>
        <div className="j-actions" style={{ marginTop: 6 }}>
          <Link className="btn btn-fill" href={`/projects/${project.slug}`}>See the project</Link>
          {project.links.demo && <a className="j-link j-arrow" href={project.links.demo} rel="noopener noreferrer" data-track="demo_visit" data-track-project={project.slug}>Live site</a>}
          {project.links.repo && <a className="j-link j-arrow" href={project.links.repo} rel="noopener noreferrer" data-track="source_click" data-track-project={project.slug}>GitHub</a>}
        </div>
      </div>
    </article>
    </TiltCard>
  );
}

export function ProjectRow({ project, bare = false }: { project: Project; bare?: boolean }) {
  const media = project.media[0];
  const Wrap = bare ? "div" : "li";
  return (
    <Wrap className="j-row" style={{ "--accent": themeColor(project.themes) } as React.CSSProperties}>
      <div className={`j-row-thumb${media ? "" : " empty"}`} aria-hidden={media ? undefined : true}>
        {media ? <Image src={media.src} alt={media.alt} width={192} height={128} sizes="96px" loading="lazy" /> : project.title.slice(0, 1)}
      </div>
      <div>
        <h3 className="display"><Link href={`/projects/${project.slug}`}>{project.title}</Link></h3>
        <p>{project.tagline}</p>
        {(project.links.demo || project.links.repo) && (
          <p className="j-actions" style={{ marginTop: 8 }}>
            {project.links.demo && <a className="j-link j-arrow" href={project.links.demo} rel="noopener noreferrer" data-track="demo_visit" data-track-project={project.slug}>Live site</a>}
            {project.links.repo && <a className="j-link j-arrow" href={project.links.repo} rel="noopener noreferrer" data-track="source_click" data-track-project={project.slug}>GitHub</a>}
          </p>
        )}
        {isProposed(project) && <p style={{ marginTop: 8 }}><Proposed /></p>}
      </div>
      <div className="j-tags"><StateTag project={project} /></div>
    </Wrap>
  );
}

export function UpdateItem({ update, projectTitle, projectSlug, bare = false }: { update: Update; projectTitle?: string; projectSlug?: string; bare?: boolean }) {
  const Wrap = bare ? "div" : "li";
  return (
    <Wrap className="j-update">
      <time dateTime={update.eventAt}>{formatDate(update.eventAt)}</time>
      <div>
        <h3 className="display"><Link href={`/updates/${update.slug}`}>{update.title}</Link></h3>
        <p>{update.summary}</p>
        <p className="j-meta" style={{ marginTop: 10 }}>
          {projectTitle && projectSlug && <Link className="j-link" href={`/projects/${projectSlug}`}>{projectTitle}</Link>}
          {isProposed(update) && <Proposed />}
        </p>
      </div>
    </Wrap>
  );
}
