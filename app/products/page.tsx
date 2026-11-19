import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { ldScript } from "@/lib/jsonld";
import {
  PRODUCTS_PAGE_DESCRIPTION,
  labProducts,
  liveLabProducts,
  productLabLd,
  resolveDemoHref,
  upcomingLabProducts,
  type LabProduct,
} from "@/lib/product-lab";
import { abs } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Products",
  description: PRODUCTS_PAGE_DESCRIPTION,
  alternates: { canonical: "/products" },
  openGraph: {
    title: "Products · Maurice Garcia",
    description: PRODUCTS_PAGE_DESCRIPTION,
    url: abs("/products"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Products · Maurice Garcia",
    description: PRODUCTS_PAGE_DESCRIPTION,
  },
  keywords: [
    "fraud prevention",
    "chargeback evidence",
    "refund anomalies",
    "lead spam filtering",
    "transaction replay",
    "scam checker",
    "Galileo",
    "Maurice Garcia",
  ],
};

function ProductCard({ product, demo }: { product: LabProduct; demo: string | null }) {
  const live = product.status === "live";
  return (
    <article className="j-panel" id={product.slug} style={{ height: "100%" }}>
      <p className="j-tag state">{live ? "Live demo" : "Coming soon"}</p>
      <h3 className="display">{product.name}</h3>
      <p>{product.pitch}</p>
      <p className="j-muted" style={{ marginTop: 10 }}>
        <span className="eyebrow" style={{ display: "inline", marginRight: 8 }}>Who it&apos;s for</span>
        {product.audience}
      </p>
      {live && demo ? (
        <div className="actions" style={{ marginTop: 18 }}>
          <a className="btn btn-fill j-shine" href={demo} rel="noopener noreferrer" data-track="demo_visit" data-track-project={product.slug}>Try the demo</a>
        </div>
      ) : (
        <p className="j-muted" style={{ marginTop: 18 }}>A public demo is not up yet. This slot is reserved for when it ships.</p>
      )}
    </article>
  );
}

export default async function ProductsPage() {
  const resolved = await Promise.all(labProducts.map(async (product) => ({ product, demo: await resolveDemoHref(product) })));
  const live = resolved.filter((x) => x.product.status === "live");
  const soon = resolved.filter((x) => x.product.status === "coming-soon");

  return (
    <div className="studio-wrap" style={{ paddingBottom: 90 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(productLabLd(resolved)) }} />
      {live.map(({ product, demo }) => (
        <script
          key={product.slug}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: ldScript({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "@id": abs(`/products#${product.slug}`),
              name: product.name,
              description: product.pitch,
              applicationCategory: product.applicationCategory ?? "BrowserApplication",
              operatingSystem: "Web browser",
              creator: { "@id": abs("/#person") },
              author: { "@id": abs("/#person") },
              url: demo ?? abs("/products"),
              ...(demo ? { potentialAction: { "@type": "UseAction", target: demo } } : {}),
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
              creativeWorkStatus: "Released",
            }),
          }}
        />
      ))}

      <header className="j-page-head">
        <p className="eyebrow">Products</p>
        <h1 className="display">Fraud-prevention tools you can try today</h1>
        <p className="lede">After <strong>ten years in fraud prevention at Galileo</strong>, I&apos;m turning that judgment into software you can open and test. These demos use synthetic data, so you can see how a rule, a lead, a dispute, or a refund looks under pressure without touching a live book of business.</p>
        <p className="j-actions">
          <Link className="btn btn-fill j-shine" href="/connect">Talk about a tool</Link>
          <Link className="j-link j-arrow" href="/projects">See the rest of the work</Link>
        </p>
      </header>

      <section className="j-section" style={{ paddingTop: 24 }} aria-labelledby="live-h">
        <Reveal>
          <div className="j-head">
            <div>
              <p className="eyebrow">Live demos</p>
              <h2 className="display" id="live-h">{liveLabProducts.length} tools, ready to click through</h2>
            </div>
          </div>
        </Reveal>
        <div className="j-ways">
          {live.map(({ product, demo }, i) => (
            <Reveal key={product.slug} delay={i * 60}>
              <ProductCard product={product} demo={demo} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="j-section" aria-labelledby="soon-h">
        <Reveal>
          <div className="j-head">
            <div>
              <p className="eyebrow">On the bench</p>
              <h2 className="display" id="soon-h">Coming soon</h2>
            </div>
          </div>
        </Reveal>
        <p className="j-muted" style={{ marginBottom: 22, maxWidth: "46em" }}>These are reserved product slots, not live software yet. The names and pitches are set so the catalog stays honest as they land.</p>
        <div className="j-ways">
          {soon.map(({ product, demo }, i) => (
            <Reveal key={product.slug} delay={i * 60}>
              <ProductCard product={product} demo={demo} />
            </Reveal>
          ))}
        </div>
        <p className="j-muted" style={{ marginTop: 28 }}>Want to be in the first conversations around {upcomingLabProducts.map((p) => p.name).join(", ").replace(/, ([^,]*)$/, " or $1")}? <Link className="j-link" href="/connect">Say hello</Link>.</p>
      </section>
    </div>
  );
}
