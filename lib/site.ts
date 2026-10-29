export const site = {
  name: "Maurice Garcia",
  title: "Maurice Garcia: Experience Engineer, creative technologist, independent builder",
  description:
    "Maurice Garcia is an Experience Engineer and independent builder working across AI, software, automation, interactive experiences, games, Android and experimental technology. See what he has built, learn to build with AI, or work with him.",
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

/**
 * The owner's YouTube channel, configured by environment variable and never invented.
 * Only a well-formed https youtube.com channel URL is accepted; anything else is treated as "not set".
 */
export function youtubeChannelUrl(): string | null {
  const v = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL?.trim();
  return v && /^https:\/\/(www\.)?youtube\.com\/(@[\w.-]+|channel\/[\w-]+|c\/[\w.-]+|user\/[\w.-]+)\/?$/.test(v) ? v : null;
}
