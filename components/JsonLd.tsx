import { site } from "@/lib/site";

export function JsonLd() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: "Full-stack engineer",
    url: site.url,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      addressRegion: "CA",
      addressCountry: "US",
    },
    sameAs: [site.github, site.instagram],
    image: `${site.url}${site.photo}`,
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Maurice Garcia",
    description: site.description,
    url: site.url,
    email: site.email,
    areaServed: "United States",
    founder: { "@type": "Person", name: site.name },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }}
      />
    </>
  );
}
