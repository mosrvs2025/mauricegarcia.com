export const site = {
  name: "Maurice Garcia",
  title: "Maurice Garcia: useful tools, playful worlds, experiments worth trying",
  description:
    "I'm Maurice. I build useful tools, playful worlds, and experiments worth trying. Try them, follow how they're going, and say hello.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://mauricegarcia.com",
  email: "hello@mauricegarcia.com",
  github: "https://github.com/mosrvs2025",
  githubHandle: "mosrvs2025",
  instagram: "https://instagram.com/itstherealmoe",
  instagramHandle: "itstherealmoe",
  photo: "/images/maurice.jpg",
  pipelineUrl: "https://pl.donhowardconstruction.com/",
} as const;
// Location is intentionally omitted until the owner resolves the California / Salt Lake City conflict.

export function linkedInUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_LINKEDIN_URL?.trim();
  return value ? value : null;
}

export const abs = (path: string) => `${site.url}${path}`;
