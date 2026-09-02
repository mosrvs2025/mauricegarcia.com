export type Product = {
  slug: string;
  file: string;
  title: string;
  priceCents: number;
  priceLabel: string;
  pages: string;
  blurb: string;
};

export const products: Product[] = [
  {
    slug: "invoice2go-playbook",
    file: "replace-invoice2go.pdf",
    title: "Replace Invoice2Go",
    priceCents: 2900,
    priceLabel: "$29",
    pages: "8–12 pages",
    blurb:
      "A practical playbook for leaving Invoice2Go: what to migrate, how to keep estimates and invoices moving, and how to stand up an ops app without stalling the shop.",
  },
  {
    slug: "scope-crm",
    file: "scope-a-crm.pdf",
    title: "How to scope a CRM for a trade shop",
    priceCents: 1900,
    priceLabel: "$19",
    pages: "6–8 pages",
    blurb:
      "A buyer’s guide for owners who need a CRM that matches the work — leads, estimates, deposits, jobs — instead of a generic sales pipeline.",
  },
];

export function productBySlug(slug: string | null | undefined) {
  if (!slug) return undefined;
  return products.find((p) => p.slug === slug);
}

export function stripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}
