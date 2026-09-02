export type Service = {
  slug: string;
  name: string;
  price: string;
  summary: string;
  details: string[];
};

export const services: Service[] = [
  {
    slug: "custom-ops-app",
    name: "Custom ops app",
    price: "Starting at $8,000",
    summary:
      "A purpose-built web app for how your shop actually works — leads, estimates, invoices, jobs, and the paperwork in between.",
    details: [
      "Discovery with the people who run the work, not a generic intake form",
      "A live Next.js app you can use on phones and shop computers",
      "Estimates, invoices, payments, and job records wired to your process",
      "Handoff with source code and a short operating note",
    ],
  },
  {
    slug: "product-sprint",
    name: "2-week product sprint",
    price: "$4,500",
    summary:
      "Two focused weeks to turn a messy workflow into a working slice you can click, show a crew, and decide what to build next.",
    details: [
      "One problem, one user, one outcome",
      "Clickable production-grade UI, not a throwaway prototype",
      "Written scope for the next slice",
      "Daily async notes so you are never guessing progress",
    ],
  },
  {
    slug: "advisory",
    name: "Advisory retainer",
    price: "$2,000 / month",
    summary:
      "A monthly working relationship for architecture, vendor choices, and the unglamorous decisions that keep software from rotting.",
    details: [
      "Scheduled working sessions plus async review",
      "Help hiring or briefing other developers",
      "Honest advice on build vs. buy",
      "Cancel anytime; billed monthly",
    ],
  },
];

export function serviceBySlug(slug: string | null | undefined) {
  if (!slug) return undefined;
  return services.find((s) => s.slug === slug);
}
