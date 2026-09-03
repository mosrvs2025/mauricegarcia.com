export type Service = {
  slug: string;
  name: string;
  price: string;
  summary: string;
  details: string[];
  kind: "software" | "video";
};

export const services: Service[] = [
  {
    slug: "custom-ops-app",
    name: "Custom ops app",
    price: "Starting at $8,000",
    summary:
      "A purpose-built web app for how your shop actually works — leads, estimates, invoices, jobs, and the paperwork in between.",
    kind: "software",
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
    kind: "software",
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
    kind: "software",
    details: [
      "Scheduled working sessions plus async review",
      "Help hiring or briefing other developers",
      "Honest advice on build vs. buy",
      "Cancel anytime; billed monthly",
    ],
  },
  {
    slug: "video-one-ad",
    name: "One ad",
    price: "$750",
    summary:
      "One 15–30 second spot for a local business: concept, cut, captions, and a version ready for Reels / Shorts / Facebook.",
    kind: "video",
    details: [
      "One round of revisions",
      "Hook, offer, and a clear call to action",
      "Vertical and square exports",
      "You keep the files",
    ],
  },
  {
    slug: "video-monthly",
    name: "Monthly ads",
    price: "$1,000 / month",
    summary:
      "A standing cadence of video ads so the page does not go quiet after one post.",
    kind: "video",
    details: [
      "Two to four new spots per month",
      "Captions and platform-ready crops",
      "Simple monthly brief",
      "Cancel anytime",
    ],
  },
  {
    slug: "video-launch",
    name: "Launch pack",
    price: "$2,500",
    summary:
      "A first-month burst: several ads plus stills so you can run a real campaign.",
    kind: "video",
    details: [
      "Five video spots",
      "Matching stills for posts and stories",
      "Script outlines you can reuse",
      "Handoff call to pick what runs first",
    ],
  },
];

export function serviceBySlug(slug: string | null | undefined) {
  if (!slug) return undefined;
  return services.find((s) => s.slug === slug);
}
