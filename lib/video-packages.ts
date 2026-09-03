export type VideoPackage = {
  slug: string;
  name: string;
  price: string;
  summary: string;
  details: string[];
};

export const videoPackages: VideoPackage[] = [
  {
    slug: "video-one-ad",
    name: "One ad",
    price: "$750",
    summary:
      "One 15–30 second spot for a local business: concept, cut, captions, and a version ready for Reels / Shorts / Facebook.",
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
      "A standing cadence of video ads so the page does not go quiet after one post. Built for shops that need to stay in front of the same town every week.",
    details: [
      "Two to four new spots per month",
      "Captions and platform-ready crops",
      "Simple monthly brief, not a 40-page deck",
      "Cancel anytime",
    ],
  },
  {
    slug: "video-launch",
    name: "Launch pack",
    price: "$2,500",
    summary:
      "A first-month burst: several ads plus stills so you can run a real campaign instead of one lonely clip.",
    details: [
      "Five video spots",
      "Matching stills for posts and stories",
      "Script outlines you can reuse",
      "Handoff call to pick what runs first",
    ],
  },
];
