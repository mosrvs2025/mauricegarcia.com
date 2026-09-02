import type { Metadata } from "next";
import { ShopBuyButton } from "@/components/ShopBuyButton";
import { products, stripeConfigured } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Short practical PDFs for trade-shop owners: replacing Invoice2Go and scoping a CRM.",
};

export default function ShopPage() {
  const stripeReady = stripeConfigured();
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-5 py-16">
      <header className="max-w-2xl">
        <p className="stamp">Shop</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">Field notes as PDFs.</h1>
        <p className="mt-4 text-lg text-[var(--color-ink-soft)]">
          Paid downloads. If checkout is not configured yet, email{" "}
          <a href="mailto:hello@mauricegarcia.com" className="underline">
            hello@mauricegarcia.com
          </a>{" "}
          and I will send an invoice.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {products.map((p) => (
          <article key={p.slug} className="border border-[var(--color-rule)] p-7">
            <p className="stamp">
              {p.priceLabel} · {p.pages}
            </p>
            <h2 className="display mt-4 text-3xl">{p.title}</h2>
            <p className="mt-4 leading-relaxed text-[var(--color-ink-soft)]">{p.blurb}</p>
            <div className="mt-8">
              <ShopBuyButton slug={p.slug} title={p.title} stripeReady={stripeReady} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
