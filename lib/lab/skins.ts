export type SkinId = "paper" | "terminal" | "pop" | "glass" | "swiss" | "arcade";

export type Skin = { id: SkinId; name: string; vibe: string; goodFor: string; type: string; swatches: string[] };

/** The design directions in the lab. Every one renders the same real content. */
export const SKINS: Skin[] = [
  { id: "paper", name: "Paper & Ink", vibe: "A printed journal: serif headlines, hairline rules, one red pen.", goodFor: "Writers, consultants, studios that want to feel established and thoughtful.", type: "Fraunces + Instrument Sans", swatches: ["#f3eee3", "#1b1814", "#c8321f"] },
  { id: "terminal", name: "Terminal", vibe: "A command line that happens to be a website. Types itself out.", goodFor: "Developers, security and infrastructure folks, anyone who wants instant credibility with engineers.", type: "JetBrains Mono", swatches: ["#0a0f0a", "#5cff8a", "#c9f7d4"] },
  { id: "pop", name: "Neo-Pop", vibe: "Loud colour, thick borders, hard shadows and stickers.", goodFor: "Food, events, creators, kids' brands: anything that should feel fun and friendly.", type: "Archivo Black + Space Grotesk", swatches: ["#ffe14d", "#111111", "#ff4fa3", "#3d7bff"] },
  { id: "glass", name: "Glass Aurora", vibe: "Soft light, frosted panels, a glow that follows your cursor.", goodFor: "Apps, wellness, premium products and anything that wants to feel calm and modern.", type: "Instrument Sans", swatches: ["#0b0b1a", "#7a5cff", "#2fd6a1", "#ff6a9e"] },
  { id: "swiss", name: "Swiss Grid", vibe: "Strict columns, giant type, one red block. Visible grid.", goodFor: "Architects, designers, agencies and any business that wants to look precise.", type: "Instrument Sans (heavy)", swatches: ["#ffffff", "#111111", "#e5251d"] },
  { id: "arcade", name: "Arcade", vibe: "Pixel type, scanlines and a level-select screen.", goodFor: "Games, bars and venues, youth brands, nostalgic products.", type: "Press Start 2P", swatches: ["#08040f", "#ff3ea5", "#2ff3ff", "#ffe14d"] },
];
export const skinById = (id: string) => SKINS.find((s) => s.id === id);
