/**
 * Repository text is untrusted data. These helpers reduce it to short, plain,
 * inert strings before it is stored. The site renders such strings escaped, and
 * nothing here (or anywhere in the sync) interprets text as instructions.
 */
export function sanitizeText(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  let s = input
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "")
    .replace(/[`*_~#>|]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length > max) s = s.slice(0, Math.max(0, max - 1)).replace(/\s+\S*$/, "").trimEnd() + "…";
  return s;
}

export function firstParagraph(markdown: string): string {
  const paras = markdown.replace(/\r/g, "").split(/\n{2,}/).map((p) => p.trim()).filter((p) => p && !/^(#|```|[-*]\s*$)/.test(p));
  return paras[0] || "";
}

export function slugify(input: string, max = 60): string {
  const s = input.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (s.slice(0, max).replace(/-+$/, "")) || "update";
}

/** eventId → filesystem-safe file stem. */
export function fileStem(eventId: string): string {
  return eventId.replace(/[^A-Za-z0-9._-]/g, "_");
}

const GITHUB_URL = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\/(releases\/tag\/[^\s?#]+|pull\/\d+|commit\/[0-9a-f]{7,40}|blob\/[^\s?#]+|tree\/[^\s?#]+|actions\/runs\/\d+)\/?$/i;

/** Evidence from a source repo must point back into that same repo. Anything else is dropped. */
export function validEvidenceUrl(url: string | undefined, repo: string): string | undefined {
  if (!url) return undefined;
  const m = GITHUB_URL.exec(url);
  if (!m || m[1].toLowerCase() !== repo.toLowerCase()) return undefined;
  return url;
}

export type EvidenceKind = "release" | "pull-request" | "source";
export function evidenceKind(url: string): EvidenceKind {
  if (/\/releases\/tag\//.test(url)) return "release";
  if (/\/pull\/\d+/.test(url)) return "pull-request";
  return "source";
}
