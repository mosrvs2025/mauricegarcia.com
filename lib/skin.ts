/** Whole-site styles. "workshop" is the default and is represented by having no data-skin attribute. */
export const SITE_SKINS = [
  { id: "workshop", name: "Workshop", note: "Dark and warm. The default.", swatch: ["#12100d", "#f3ede3", "#ff7a4d"] },
  { id: "paper", name: "Paper & Ink", note: "A printed journal.", swatch: ["#f3eee3", "#1b1814", "#c8321f"] },
  { id: "terminal", name: "Terminal", note: "Monospace, phosphor green.", swatch: ["#050805", "#c9f7d4", "#5cff8a"] },
  { id: "pop", name: "Neo-Pop", note: "Loud colour, hard shadows.", swatch: ["#ffe14d", "#111111", "#ff4fa3"] },
  { id: "glass", name: "Glass Aurora", note: "Frosted panels, soft light.", swatch: ["#07071a", "#a58bff", "#2fd6a1"] },
  { id: "swiss", name: "Swiss Grid", note: "Stark, precise, one red.", swatch: ["#ffffff", "#111111", "#d9211a"] },
  { id: "arcade", name: "Arcade", note: "Neon on black.", swatch: ["#08040f", "#ff3ea5", "#2ff3ff"] },
] as const;
export type SkinKey = (typeof SITE_SKINS)[number]["id"];
export const STORAGE_KEY = "mg-skin";
/** Pages that carry their own older styles keep the default look. */
export const LEGACY_PREFIXES = /^\/(coaching|ai-receptionist|shop|ads|studio|lab|v)(\/|$)/;

/** Runs before first paint so there's no flash. Reads ?skin= (shareable) or the saved choice. */
export const SKIN_BOOT_SCRIPT = `(function(){try{var ok=${JSON.stringify(SITE_SKINS.map((s) => s.id).filter((i) => i !== "workshop"))};var p=location.pathname;var q=new URLSearchParams(location.search).get("skin");if(q==="workshop"){localStorage.removeItem("${STORAGE_KEY}")}else if(q&&ok.indexOf(q)>-1){localStorage.setItem("${STORAGE_KEY}",q)}var s=localStorage.getItem("${STORAGE_KEY}");if(!${LEGACY_PREFIXES}.test(p)&&s&&ok.indexOf(s)>-1){document.documentElement.setAttribute("data-skin",s)}}catch(e){}})();`;
