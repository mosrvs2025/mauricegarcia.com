export const site = {
  name: "Maurice Garcia",
  title: "Maurice Garcia — independent full-stack engineer",
  description:
    "Independent full-stack engineer in California. I build operations software for small businesses — estimates, invoices, jobs, and the tools crews actually use.",
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
