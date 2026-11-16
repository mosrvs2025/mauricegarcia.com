import { abs, linkedInUrl, site, youtubeChannelUrl } from "./site";
import type { Project } from "./content/schemas";

const PERSON_ID = abs("/#person");
const WEBSITE_ID = abs("/#website");

/** Every profile the site itself links to, plus GitHub. LinkedIn and YouTube appear only when the owner has configured them. */
export const profileLinks = (): string[] => [site.github, site.instagram, linkedInUrl(), youtubeChannelUrl()].filter((u): u is string => Boolean(u));

/** Rendered once, in the root layout, so every page carries the same entity and nothing is duplicated per page. */
export const personLd = () => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": PERSON_ID,
  name: site.name,
  jobTitle: "Experience Engineer",
  description: "Experience Engineer, creative technologist and independent builder working across AI, software, automation, interactive experiences, games, Android and experimental technology.",
  knowsAbout: ["Artificial intelligence", "Software engineering", "Automation", "Interactive experiences", "Game development", "Android development"],
  url: site.url,
  email: site.email,
  image: abs(site.photo),
  mainEntityOfPage: abs("/about"),
  sameAs: profileLinks(),
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: site.name,
  url: site.url,
  description: site.description,
  inLanguage: "en-US",
  author: { "@id": PERSON_ID },
  publisher: { "@id": PERSON_ID },
});

/** The About page is a profile page about the Person already declared in the root layout; it points at that entity instead of repeating it. */
export const aboutPageLd = () => ({
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": abs("/about#profile"),
  url: abs("/about"),
  name: `About ${site.name}`,
  description: site.description,
  inLanguage: "en-US",
  isPartOf: { "@id": WEBSITE_ID },
  mainEntity: { "@id": PERSON_ID },
});

/**
 * Only states what the project file says. A repo link yields SoftwareSourceCode, otherwise a CreativeWork.
 * A project with a public demo is also typed as software (a VideoGame when it is a game) and says it runs in a browser,
 * which is what the demo link is. Maturity is passed through as creativeWorkStatus so an honest "Prototype" stays honest.
 */
export const projectLd = (p: Project) => {
  const isGame = p.themes.includes("games");
  const types = [p.links.repo ? "SoftwareSourceCode" : "CreativeWork", ...(p.links.demo ? [isGame ? "VideoGame" : "SoftwareApplication"] : [])];
  return {
    "@context": "https://schema.org",
    "@type": types.length === 1 ? types[0] : types,
    "@id": abs(`/projects/${p.slug}#project`),
    name: p.title, description: p.tagline, url: abs(`/projects/${p.slug}`),
    mainEntityOfPage: abs(`/projects/${p.slug}`),
    isPartOf: { "@id": WEBSITE_ID },
    author: { "@id": PERSON_ID },
    creator: { "@id": PERSON_ID },
    creativeWorkStatus: p.maturity.charAt(0).toUpperCase() + p.maturity.slice(1),
    ...(p.links.demo ? { operatingSystem: "Web browser", ...(isGame ? { applicationCategory: "GameApplication", gamePlatform: "Web browser" } : { applicationCategory: "BrowserApplication" }), potentialAction: { "@type": isGame ? "PlayGameAction" : "UseAction", target: p.links.demo } } : {}),
    ...(p.links.repo ? { codeRepository: p.links.repo } : {}),
    ...(p.dates.started ? { dateCreated: p.dates.started } : {}),
    ...(p.dates.lastChange ? { dateModified: p.dates.lastChange } : {}),
    ...(p.media[0] ? { image: abs(p.media[0].src) } : {}),
    ...(p.upstream ? { isBasedOn: p.upstream.url } : {}),
  };
};

export const ldScript = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
