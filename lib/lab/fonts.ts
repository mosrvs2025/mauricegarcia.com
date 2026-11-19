import { Archivo_Black, JetBrains_Mono, Press_Start_2P } from "next/font/google";

// Loaded only by the /lab routes, so the main site never downloads them.
// Space Grotesk is already loaded once in app/layout.tsx as --font-space-grotesk.
// next/font/google allows only one loader per family, so /lab reuses that variable.
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--f-mono", display: "swap" });
export const black = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--f-black", display: "swap" });
export const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--f-pixel", display: "swap" });
export const labFonts = `${mono.variable} ${black.variable} ${pixel.variable}`;
