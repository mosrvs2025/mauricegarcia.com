import { Archivo_Black, JetBrains_Mono, Press_Start_2P, Space_Grotesk } from "next/font/google";

// Loaded only by the /lab routes, so the main site never downloads them.
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--f-mono", display: "swap" });
export const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--f-grotesk", display: "swap" });
export const black = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--f-black", display: "swap" });
export const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--f-pixel", display: "swap" });
export const labFonts = `${mono.variable} ${grotesk.variable} ${black.variable} ${pixel.variable}`;
