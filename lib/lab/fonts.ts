import { JetBrains_Mono, Press_Start_2P } from "next/font/google";

// Loaded only by the /lab routes, so the main site never downloads them.
// Space Grotesk and Archivo Black are already loaded once in app/layout.tsx
// (--font-space-grotesk, --font-archivo-black). next/font/google allows only one
// loader per family, so /lab reuses those variables.
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--f-mono", display: "swap" });
export const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--f-pixel", display: "swap" });
export const labFonts = `${mono.variable} ${pixel.variable}`;
