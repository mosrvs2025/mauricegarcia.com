import { cache } from "react";
import { isListed, isShown } from "./visibility";
import { loadLessons, loadNow, loadPosts, loadProjects, loadUpdates } from "./load";
import type { Lesson, Now, Post, Project, Update } from "./schemas";

/** Shown = has a page (public + unlisted). Listed = also appears in lists/feeds/sitemap. */
const projects = cache(() => loadProjects());
const updates = cache(() => loadUpdates());
const posts = cache(() => loadPosts());
const lessons = cache(() => loadLessons());

export const shownProjects = (): Project[] => projects().filter(isShown);
export const listedProjects = (): Project[] => projects().filter(isListed);
export const featuredProjects = (): Project[] => listedProjects().filter((p) => p.tier === "featured");
export const projectsByTrack = (t: string): Project[] => listedProjects().filter((p) => p.track === t);
export const featuredByTrack = (t: string): Project[] => featuredProjects().filter((p) => p.track === t);
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

export const shownLessons = (): Lesson[] => lessons().filter(isShown);
export const listedLessons = (): Lesson[] => lessons().filter(isListed);
export const lessonBySlug = (slug: string): Lesson | undefined => shownLessons().find((l) => l.slug === slug);

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

export const MATURITY_LABELS: Record<string, string> = {
  production: "Production",
  beta: "Beta",
  prototype: "Prototype",
  concept: "Concept",
};
export const MATURITY_HELP: Record<string, string> = {
  production: "In real use, with the use documented.",
  beta: "A public demo works today. Expect rough edges.",
  prototype: "Built and runnable, but not yet shown working to the public.",
  concept: "An idea or design, with little or nothing built.",
};
export const TRACK_LABELS: Record<string, { title: string; blurb: string }> = {
  products: { title: "Products", blurb: "Practical software with a clear user and a business case." },
  experiences: { title: "Experiences", blurb: "Games, worlds and interactive pieces, built to be played." },
  labs: { title: "Labs", blurb: "Experimental technology and AI and creative tools, built to find out what's possible." },
};
export const CHANNEL_LABELS: Record<string, string> = {
  "custom-development": "custom development",
  subscription: "subscription products",
  licensing: "licensing",
  education: "education",
  partnership: "partnerships",
};

/** Date-only strings are rendered as written; no timezone drift. */
export function formatDate(value: string): string {
  const day = value.slice(0, 10);
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}
