/**
 * What the owner builds, in his own framing, each tied to real projects on this site.
 * "proof" slugs must exist as published projects (checked in tests), so no capability is claimed without work behind it.
 */
export type Capability = { id: string; title: string; line: string; proof: string[]; href?: string };

export const capabilities: Capability[] = [
  { id: "ai", title: "AI and automation", line: "AI integrations and agent workflows that do real work, with the failure cases designed in.", proof: ["lumen", "thriftscout"] },
  { id: "software", title: "Custom software and products", line: "From an idea to a working, deployed product. Web apps, internal tools, data-heavy systems.", proof: ["pipeline-crm", "thriftscout"] },
  { id: "experiences", title: "Interactive experiences and games", line: "Real-time 3D, game systems and interactive pieces that run in a browser tab.", proof: ["thornwild", "lineage", "mosslight"] },
  { id: "android", title: "Android and mobile", line: "Offline-first Android tools and phone-first web apps.", proof: ["ultimate"] },
  { id: "experimental", title: "Experimental technology", line: "Prototypes that test an unusual idea quickly, so you learn if it's worth building.", proof: ["reality-research", "swirl-room", "roomspace"] },
  { id: "teaching", title: "Teaching people to build with AI", line: "Practical, tool-agnostic ways to make useful things, including from very little programming experience.", proof: [], href: "/learn" },
];
