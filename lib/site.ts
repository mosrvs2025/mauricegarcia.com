export const site = {
  name: "Maurice Garcia",
  title: "Maurice Garcia — Websites & custom software",
  description:
    "Custom websites, redesigns, and software for small businesses. Tell Maurice Garcia what you need and get a project proposal.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://mauricegarcia.com",
  email: "hello@mauricegarcia.com",
  location: "California",
  github: "https://github.com/mosrvs2025",
  githubHandle: "mosrvs2025",
  instagram: "https://instagram.com/itstherealmoe",
  instagramHandle: "itstherealmoe",
  photo: "/images/maurice.jpg",
  pipelineUrl: "https://pl.donhowardconstruction.com/",
} as const;

export function linkedInUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_LINKEDIN_URL?.trim();
  return value ? value : null;
}


