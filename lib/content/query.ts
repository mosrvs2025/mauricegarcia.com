import { cache } from "react";
import { isListed, isShown } from "./visibility";
import { loadNow, loadPosts, loadProjects, loadUpdates } from "./load";
import type { Now, Post, Project, Update } from "./schemas";

/** Shown = has a page (public + unlisted). Listed = also appears in lists/feeds/sitemap. */
const projects = cache(() => loadProjects());
const updates = cache(() => loadUpdates());
const posts = cache(() => loadPosts());

export const shownProjects = (): Project[] => projects().filter(isShown);
export const listedProjects = (): Project[] => projects().filter(isListed);
export const featuredProjects = (): Project[] => listedProjects().filter((p) => p.tier === "featured");
export const archiveProjects = (): Project[] => listedProjects().filter((p) => p.tier === "archive");
export const projectBySlug = (slug: string): Project | undefined => shownProjects().find((p) => p.slug === slug);
export const projectById = (id: string | undefined): Project | undefined => (id ? shownProjects().find((p) => p.id === id) : undefined);
export const projectByFormerSlug = (slug: string): Project | undefined => shownProjects().find((p) => p.formerSlugs.includes(slug));

export const shownUpdates = (): Update[] => updates().filter(isShown);
export const listedUpdates = (): Update[] => updates().filter(isListed);
export const updateBySlug = (slug: string): Update | undefined => shownUpdates().find((u) => u.slug === slug);
export const updatesForProject = (id: string): Update[] => listedUpdates().filter((u) => u.projectId === id);

export const shownPosts = (): Post[] => posts().filter(isShown);
export const listedPosts = (): Post[] => posts().filter(isListed);
export const postBySlug = (slug: string): Post | undefined => shownPosts().find((p) => p.slug === slug);
export const postsForProject = (id: string): Post[] => listedPosts().filter((p) => p.projectIds.includes(id));

export function shownNow(): Now | null {
  const n = loadNow();
  return n && isShown(n) ? n : null;
}

export const THEME_LABELS: Record<string, string> = {
  practical: "Useful tools",
  "creative-tools": "Creative tools",
  games: "Games & worlds",
  curiosity: "Curiosity & experiments",
  retail: "Retail & discovery",
};

export const STATE_LABELS: Record<string, string> = {
  prototype: "Prototype",
  pilot: "Pilot",
  "playable-slice": "Playable slice",
  simulation: "Simulation",
  "in-use": "In use",
  maintained: "Maintained",
  archived: "Archived",
};

/** Date-only strings are rendered as written; no timezone drift. */
export function formatDate(value: string): string {
  const day = value.slice(0, 10);
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}
