import type { Candidate, Project, Source } from "../content/schemas";

export type Decision = { publish: boolean; reasons: string[] };

/**
 * The editorial publication rule. A candidate becomes a published update only
 * if every condition holds; otherwise it becomes a draft for the owner.
 * `state: "publish"` in a candidate is a request, never an instruction.
 */
export function decidePublication(c: Candidate, source: Source, project: Pick<Project, "status" | "visibility"> | undefined): Decision {
  const fail: string[] = [];
  if (!source.autoPublish) fail.push("auto-publish is not enabled for this project");
  if (source.visibility !== "public") fail.push("source repository is not public");
  if (c.state !== "publish") fail.push("candidate did not request publication");
  if (!c.publicSafe) fail.push("candidate is not marked public-safe");
  if (c.status !== "shipped") fail.push("candidate does not claim shipped work");
  if (!c.completion.verified || c.completion.kind === "none") fail.push("completion evidence is not verified");
  if (!c.evidenceUrl) fail.push("no public evidence URL");
  if (!project || project.status !== "published" || project.visibility !== "public") fail.push("the project page itself is not published");
  if (c.provenance.origin === "sync" && c.completion.kind !== "release") fail.push("only verified releases may skip review");
  return { publish: fail.length === 0, reasons: fail };
}
