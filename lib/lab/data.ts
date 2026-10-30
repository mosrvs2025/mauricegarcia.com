import { featuredProjects, formatDate, listedProjects, listedUpdates, projectById, shownNow, MATURITY_LABELS } from "../content/query";

export type LabProject = { slug: string; title: string; tagline: string; stateLabel: string; image?: { src: string; alt: string }; demo?: string; last?: string; theme: string };
export type LabUpdate = { slug: string; title: string; summary: string; date: string; project?: string };
export type LabData = { name: string; headline: string[]; intro: string; projects: LabProject[]; updates: LabUpdate[]; stats: { all: number; playable: number; games: number }; focus?: string; today: string };

/** The same published content as the real site, reshaped for the style demos. Nothing here is invented. */
export function labData(): LabData {
  const all = listedProjects();
  const toP = (p: (typeof all)[number]): LabProject => ({ slug: p.slug, title: p.title, tagline: p.tagline, stateLabel: MATURITY_LABELS[p.maturity], image: p.media[0] ? { src: p.media[0].src, alt: p.media[0].alt } : undefined, demo: p.links.demo, last: p.dates.lastChange, theme: p.themes[0] });
  const now = shownNow();
  return {
    name: "Maurice Garcia",
    headline: ["I build", "useful tools,", "playful worlds,", "and experiments", "worth trying."],
    intro: "This is where I keep what I make and how it's going. Try the things, read the notes, and tell me what you think.",
    projects: featuredProjects().map(toP),
    updates: listedUpdates().slice(0, 3).map((u) => ({ slug: u.slug, title: u.title, summary: u.summary, date: formatDate(u.eventAt), project: projectById(u.projectId)?.title })),
    stats: { all: all.length, playable: all.filter((p) => p.links.demo).length, games: all.filter((p) => p.themes.includes("games")).length },
    focus: now?.focus,
    today: formatDate(new Date().toISOString()),
  };
}
