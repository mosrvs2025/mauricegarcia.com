import { abs, site } from "./site";
import type { Project } from "./content/schemas";

export const personLd = () => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": abs("/#person"),
  name: site.name,
  url: site.url,
  email: site.email,
  image: abs(site.photo),
  sameAs: [site.github, site.instagram],
});

export const websiteLd = () => ({ "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: site.url, author: { "@id": abs("/#person") } });

/** Only states what the project file says. A repo link yields SoftwareSourceCode; everything else is a CreativeWork. */
export const projectLd = (p: Project) => ({
  "@context": "https://schema.org",
  "@type": p.links.repo ? "SoftwareSourceCode" : "CreativeWork",
  name: p.title, description: p.tagline, url: abs(`/projects/${p.slug}`),
  author: { "@id": abs("/#person") },
  ...(p.links.repo ? { codeRepository: p.links.repo } : {}),
  ...(p.dates.lastChange ? { dateModified: p.dates.lastChange } : {}),
  ...(p.media[0] ? { image: abs(p.media[0].src) } : {}),
  ...(p.upstream ? { isBasedOn: p.upstream.url } : {}),
});

export const ldScript = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
