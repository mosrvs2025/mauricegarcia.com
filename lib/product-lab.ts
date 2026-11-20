import { abs } from "./site";

export type LabProductStatus = "live" | "coming-soon";

export type LabProduct = {
  slug: string;
  name: string;
  pitch: string;
  audience: string;
  status: LabProductStatus;
  /** Preferred public origin + path for "Try the demo". */
  preferredDemo?: string;
  /** Used when the preferred subdomain is not serving HTTPS 200 yet. */
  fallbackDemo?: string;
  applicationCategory?: string;
};

/** Live fraud-prevention tools plus coming-soon slots. Do not add private repo URLs here. */
export const labProducts: LabProduct[] = [
  {
    slug: "riskreplay",
    name: "RiskReplay",
    pitch: "Replay fraud rules against historical transactions and see the impact before you ship them.",
    audience: "Fraud analysts and fintech risk teams",
    status: "live",
    preferredDemo: "https://risklab.mauricegarcia.com/demo",
    fallbackDemo: "https://risklab.mauricegarcia.com/demo",
    applicationCategory: "FinanceApplication",
  },
  {
    slug: "leadfirewall",
    name: "LeadFirewall",
    pitch: "A drop-in contact form that scores leads and filters spam before they hit your inbox.",
    audience: "Contractors and agencies dealing with bot and junk leads",
    status: "live",
    preferredDemo: "https://leads.mauricegarcia.com/demo",
    fallbackDemo: "https://leads.mauricegarcia.com/demo",
    applicationCategory: "BusinessApplication",
  },
  {
    slug: "disputedeck",
    name: "DisputeDeck",
    pitch: "Build cited chargeback evidence packets merchants can actually submit.",
    audience: "Small merchants fighting payment disputes",
    status: "live",
    preferredDemo: "https://disputes.mauricegarcia.com/demo",
    fallbackDemo: "https://disputes.mauricegarcia.com/demo",
    applicationCategory: "FinanceApplication",
  },
  {
    slug: "refundradar",
    name: "RefundRadar",
    pitch: "Upload a Stripe export and flag duplicate refunds, velocity spikes, and odd patterns.",
    audience: "Operators and risk teams reviewing Stripe refunds",
    status: "live",
    preferredDemo: "https://radar.mauricegarcia.com/demo",
    fallbackDemo: "https://radar.mauricegarcia.com/demo",
    applicationCategory: "FinanceApplication",
  },
  {
    slug: "is-this-bullshit",
    name: "Is This Bullshit?",
    pitch: "Check a message, listing, or pitch for scam signals before you act on it.",
    audience: "Anyone who wants a second opinion on a suspicious offer",
    status: "live",
    preferredDemo: "https://myaiass.com",
    fallbackDemo: "https://myaiass.com",
    applicationCategory: "BrowserApplication",
  },
  {
    slug: "scopecanvas",
    name: "ScopeCanvas",
    pitch: "Turn an infinite canvas into visual project proposals with pricing and client approval.",
    audience: "Independent builders and agencies closing work",
    status: "live",
    preferredDemo: "https://scopecanvas.vercel.app/demo",
    fallbackDemo: "https://scopecanvas.vercel.app/demo",
    applicationCategory: "BusinessApplication",
  },
  {
    slug: "casecanvas",
    name: "CaseCanvas",
    pitch: "A visual fraud investigation board for assembling evidence and following a case through.",
    audience: "Fraud investigators and analysts",
    status: "live",
    preferredDemo: "https://casecanvas-nine.vercel.app/demo",
    fallbackDemo: "https://casecanvas-nine.vercel.app/demo",
    applicationCategory: "FinanceApplication",
  },
  {
    slug: "agentlatch",
    name: "AgentLatch",
    pitch: "Approval controls so AI agents cannot act until a human signs off.",
    audience: "Teams putting agents into production",
    status: "live",
    preferredDemo: "https://agentlatch.vercel.app/demo",
    fallbackDemo: "https://agentlatch.vercel.app/demo",
    applicationCategory: "DeveloperApplication",
  },
];

export const liveLabProducts = labProducts.filter((p) => p.status === "live");
export const upcomingLabProducts = labProducts.filter((p) => p.status === "coming-soon");

/**
 * Prefer the custom-domain demo when it already serves HTTPS 200; otherwise use the fallback demo URL.
 * A short timeout keeps the products page from hanging while DNS is still being pointed.
 */
export async function resolveDemoHref(product: LabProduct): Promise<string | null> {
  if (product.status !== "live") return null;
  const preferred = product.preferredDemo;
  const fallback = product.fallbackDemo ?? preferred ?? null;
  if (!preferred) return fallback;
  if (!fallback || preferred === fallback) return preferred;
  try {
    const res = await fetch(preferred, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (res.ok) return preferred;
  } catch {
    // Preferred host is not ready or the probe timed out.
  }
  return fallback;
}

export const productLabLd = (items: { product: LabProduct; demo: string | null }[]) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": abs("/products#page"),
  url: abs("/products"),
  name: "Products — Maurice Garcia",
  description:
    "Live fraud-prevention tools and upcoming product work from Maurice Garcia, after a decade in fraud prevention at Galileo.",
  inLanguage: "en-US",
  isPartOf: { "@id": abs("/#website") },
  author: { "@id": abs("/#person") },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: items.map(({ product, demo }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: softwareApplicationLd(product, demo),
    })),
  },
});

export const softwareApplicationLd = (product: LabProduct, demo: string | null) => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": abs(`/products#${product.slug}`),
  name: product.name,
  description: product.pitch,
  applicationCategory: product.applicationCategory ?? "BrowserApplication",
  operatingSystem: "Web browser",
  creator: { "@id": abs("/#person") },
  author: { "@id": abs("/#person") },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: product.status === "live" ? "https://schema.org/InStock" : "https://schema.org/PreOrder" },
  ...(demo ? { url: demo, potentialAction: { "@type": "UseAction", target: demo } } : { url: abs("/products") }),
  creativeWorkStatus: product.status === "live" ? "Released" : "ComingSoon",
});

export const PRODUCTS_PAGE_DESCRIPTION =
  "Live demos of fraud-prevention tools from Maurice Garcia, after ten years at Galileo: RiskReplay, LeadFirewall, DisputeDeck, RefundRadar, Is This Bullshit?, ScopeCanvas, CaseCanvas, and AgentLatch.";
