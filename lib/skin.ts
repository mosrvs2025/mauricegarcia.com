/**
 * Whole-site identities ("skins"). One component tree, restyled by CSS variables keyed on <html data-skin="...">.
 *
 *  - Three identities are first-class and lead the switcher: Open Case (the default), Rogue Instrument and
 *    Unauthorized Manual. Each has its own fonts, palette, type scale, hero treatment and signature detail.
 *  - Seven older skins stay available under "More skins". "workshop" is the previous default, kept as "Workshop (classic)".
 *
 * The attribute is always present: the server renders data-skin="open-case" and SKIN_BOOT_SCRIPT corrects it in <head>
 * before first paint, so a remembered or shared (?skin=) choice never flashes the wrong identity.
 */
export type SkinGroup = "identity" | "classic";
export type SiteSkin = {
  id: string; name: string; note: string; group: SkinGroup;
  /** [background, text, accent]. Used for the switcher previews and for the document's theme-color. */
  swatch: readonly [string, string, string];
  /** Specimen set in the identity's own display face inside the switcher (its fonts load only when the menu opens). */
  specimen: string;
  /** Font variables (from next/font in app/layout.tsx) this identity needs; warmed before a switch so text never reflows mid-fade. */
  fonts: readonly string[];
  /** Browser UI colour (<meta name="theme-color">). */
  themeColor: string;
};

export const SITE_SKINS = [
  { id: "open-case", name: "Softworks", note: "Architectural neumorphism. Matte ceramic, warm tactile depth.", group: "identity", swatch: ["#E8EEF2", "#1B2B3A", "#155E8A"], specimen: "I BUILD THINGS.", fonts: ["--font-manrope", "--font-dm-sans"], themeColor: "#E8EEF2" },
  { id: "rogue-instrument", name: "Mercury", note: "Liquid chrome & dark enamel. Reflective highlights, cinematic scale.", group: "identity", swatch: ["#090D15", "#F8FAFF", "#72E4FF"], specimen: "SYSTEMS DO MORE.", fonts: ["--font-syne", "--font-space-grotesk"], themeColor: "#090D15" },
  { id: "unauthorized-manual", name: "Parallax", note: "Spatial glass architecture. Layered translucent planes with depth.", group: "identity", swatch: ["#0B1423", "#F8FBFF", "#9EF3DC"], specimen: "DO NOT BUILD NORMAL", fonts: ["--font-outfit", "--font-plex"], themeColor: "#0B1423" },
  { id: "workshop", name: "Workshop (classic)", note: "Dark and warm. The previous default.", group: "classic", swatch: ["#12100d", "#f3ede3", "#ff7a4d"], specimen: "Useful products.", fonts: ["--font-fraunces", "--font-instrument"], themeColor: "#12100d" },
  { id: "paper", name: "Paper & Ink", note: "A printed journal.", group: "classic", swatch: ["#f3eee3", "#1b1814", "#c8321f"], specimen: "Useful products.", fonts: ["--font-fraunces", "--font-instrument"], themeColor: "#f3eee3" },
  { id: "terminal", name: "Terminal", note: "Monospace, phosphor green.", group: "classic", swatch: ["#050805", "#c9f7d4", "#5cff8a"], specimen: "$ useful --products", fonts: [], themeColor: "#050805" },
  { id: "pop", name: "Neo-Pop", note: "Loud colour, hard shadows.", group: "classic", swatch: ["#ffe14d", "#111111", "#ff4fa3"], specimen: "Useful products!", fonts: ["--font-instrument"], themeColor: "#ffe14d" },
  { id: "glass", name: "Glass Aurora", note: "Frosted panels, soft light.", group: "classic", swatch: ["#07071a", "#a58bff", "#2fd6a1"], specimen: "Useful products.", fonts: ["--font-fraunces", "--font-instrument"], themeColor: "#07071a" },
  { id: "swiss", name: "Swiss Grid", note: "Stark, precise, one red.", group: "classic", swatch: ["#ffffff", "#111111", "#d9211a"], specimen: "Useful products.", fonts: ["--font-instrument"], themeColor: "#ffffff" },
  { id: "arcade", name: "Arcade", note: "Neon on black.", group: "classic", swatch: ["#08040f", "#ff3ea5", "#2ff3ff"], specimen: "USEFUL PRODUCTS", fonts: [], themeColor: "#08040f" },
] as const satisfies readonly SiteSkin[];

export type SkinKey = (typeof SITE_SKINS)[number]["id"];
export const DEFAULT_SKIN: SkinKey = "open-case";
/** The three new identities, in switcher order. */
export const IDENTITY_SKINS = SITE_SKINS.filter((s) => s.group === "identity");
/** The older skins, shown under "More skins". */
export const CLASSIC_SKINS = SITE_SKINS.filter((s) => s.group === "classic");
export const isSkin = (v: unknown): v is SkinKey => typeof v === "string" && SITE_SKINS.some((s) => s.id === v);
/** html[data-kind] is "identity" for the three new skins and "classic" for the older ones, so shared identity rules need one short selector. */
export const kindOf = (id: string): SkinGroup => skinMeta(id).group;
export const skinMeta = (id: string) => SITE_SKINS.find((s) => s.id === id) ?? SITE_SKINS[0];

export const STORAGE_KEY = "mg-skin";
/** The skin that older standalone pages (and the preserved "classic" chrome around them) always use. */
export const LEGACY_SKIN: SkinKey = "workshop";
/** Pages that carry their own older styles keep the classic look. */
export const LEGACY_PREFIXES = /^\/(coaching|ai-receptionist|shop|ads|studio|lab|v)(\/|$)/;
/** Visitor-chosen skin: ?skin=default (or reset) forgets the saved choice and returns to the default identity. */
export const RESET_SKIN_VALUES = ["default", "reset"] as const;

/**
 * Runs in <head> before first paint. Always sets data-skin (never leaves it off) from, in order:
 * a shareable ?skin= link (which is also saved), the saved choice, then the default identity. Legacy routes get the classic skin.
 * Never throws: blocked storage only means the choice is not remembered.
 */
export const SKIN_BOOT_SCRIPT = `(function(){var d=document.documentElement,v=${JSON.stringify(DEFAULT_SKIN)};try{var ok=${JSON.stringify(SITE_SKINS.map((s) => s.id))},T=${JSON.stringify(Object.fromEntries(SITE_SKINS.map((s) => [s.id, s.themeColor])))},q=new URLSearchParams(location.search).get("skin"),s=null,c=null;
try{if(q==="default"||q==="reset"){localStorage.removeItem("${STORAGE_KEY}")}else if(q&&ok.indexOf(q)>-1){localStorage.setItem("${STORAGE_KEY}",q)}s=localStorage.getItem("${STORAGE_KEY}")}catch(e){}
c=q&&ok.indexOf(q)>-1?q:s;if(c&&ok.indexOf(c)>-1)v=c;if(${LEGACY_PREFIXES}.test(location.pathname))v=${JSON.stringify(LEGACY_SKIN)};
var m=document.querySelector&&document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",T[v])}catch(e){}d.setAttribute("data-skin",v);d.setAttribute("data-kind",${JSON.stringify(Object.fromEntries(SITE_SKINS.map((s) => [s.id, s.group])))}[v]||"identity")})();`;
