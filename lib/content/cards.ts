import type { Project } from "./schemas";
import { STATE_LABELS, THEME_LABELS } from "./query";
import { isProposed } from "./visibility";

/** The serializable slice of a project that cards and the browser need. */
export type ProjectCard = {
  slug: string; title: string; tagline: string; themes: string[]; themeLabels: string[];
  state: string; stateLabel: string; tier: "featured" | "archive"; lastChange?: string;
  image?: { src: string; alt: string }; preview?: { webm: string; mp4: string; poster: string };
  proposed: boolean; playable: boolean; game: boolean; client: boolean; demo?: string; repo?: string; shots: number;
};

export const toCard = (p: Project): ProjectCard => ({
  slug: p.slug, title: p.title, tagline: p.tagline, themes: p.themes, themeLabels: p.themes.map((t) => THEME_LABELS[t]),
  state: p.state, stateLabel: STATE_LABELS[p.state], tier: p.tier, lastChange: p.dates.lastChange,
  image: p.media[0] ? { src: p.media[0].src, alt: p.media[0].alt } : undefined,
  preview: p.preview ? { webm: p.preview.webm, mp4: p.preview.mp4, poster: p.preview.poster } : undefined,
  proposed: isProposed(p), playable: !!p.links.demo, game: p.themes.includes("games"),
  client: p.involve.intent === "paid-work", demo: p.links.demo, repo: p.links.repo, shots: p.media.length,
});
