import type { Metadata, Viewport } from "next";
import { Anybody, Archivo_Black, Atkinson_Hyperlegible_Next, Fraunces, IBM_Plex_Sans, Instrument_Sans, Public_Sans, Saira_Condensed } from "next/font/google";
import { ActionTracker } from "@/components/ActionTracker";
import { Analytics } from "@/components/Analytics";
import { EngagementTracker } from "@/components/EngagementTracker";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { IntroOverlay } from "@/components/IntroOverlay";
import { PageTransition } from "@/components/PageTransition";
import { Playground } from "@/components/play/Playground";
import { QuickContact } from "@/components/QuickContact";
import { FloatGuard } from "@/components/FloatGuard";
import { isPreviewBuild } from "@/lib/content/visibility";
import { INTRO_BOOT_SCRIPT, INTRO_CSS } from "@/lib/motion";
import { listedProjects } from "@/lib/content/query";
import { DEFAULT_SKIN, SKIN_BOOT_SCRIPT, kindOf, skinMeta } from "@/lib/skin";
import { ldScript, personLd, websiteLd } from "@/lib/jsonld";
import { site } from "@/lib/site";
import "./globals.css";
import "./tokens.css";
import "./journal.css";
import "./skins.css";
import "./identities.css";
import "./motion.css";
import "./play.css";

/*
 * Fonts, all self-hosted by next/font. Only the default identity's two faces (Open Case: Anybody + Atkinson Hyperlegible
 * Next) are preloaded; every other face is declared but preload:false, so the browser fetches it only when a
 * visitor actually switches to a skin that uses it. Semantic tokens (--font-display, --font-sans) are set in app/globals.css.
 */
const anybody = Anybody({ subsets: ["latin"], variable: "--font-anybody", display: "swap", weight: "variable", axes: ["wdth"] });
const atkinson = Atkinson_Hyperlegible_Next({ subsets: ["latin"], variable: "--font-atkinson", display: "swap", weight: "variable" });
const saira = Saira_Condensed({ subsets: ["latin"], variable: "--font-saira", display: "swap", weight: ["500", "600", "700", "800"], preload: false });
const plex = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-plex", display: "swap", weight: "variable", preload: false });
const archivoBlack = Archivo_Black({ subsets: ["latin"], variable: "--font-archivo-black", display: "swap", weight: "400", preload: false });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap", weight: "variable", preload: false });
// The previous default's faces, kept for the Workshop, Paper, Neo-Pop and Glass skins.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"], preload: false });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap", preload: false });
const fontVars = [anybody, atkinson, saira, plex, archivoBlack, publicSans, fraunces, instrument].map((f) => f.variable).join(" ");

export const viewport: Viewport = { themeColor: skinMeta(DEFAULT_SKIN).themeColor, colorScheme: "light dark" };

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s · Maurice Garcia" },
  description: site.description,
  alternates: {
    canonical: "./",
    types: { "application/rss+xml": [{ url: "/writing/rss.xml", title: "Maurice Garcia: writing" }, { url: "/updates/rss.xml", title: "Maurice Garcia: updates" }] },
  },
  openGraph: { title: site.title, description: site.description, url: "./", siteName: site.name, locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Listed projects only: unlisted pages stay reachable, but their slugs must not appear in the shared layout payload.
  const projectTracks = Object.fromEntries(listedProjects().map((p) => [p.slug, p.track]));
  return (
    <html lang="en" className={fontVars} data-skin={DEFAULT_SKIN} data-kind={kindOf(DEFAULT_SKIN)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKIN_BOOT_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: INTRO_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <IntroOverlay />
        <a href="#main" className="skip-link">Skip to content</a>
        <Analytics />
        <ActionTracker />
        <EngagementTracker />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(personLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(websiteLd()) }} />
        {isPreviewBuild() && <div className="j-banner" role="status">Preview build: items marked “Proposed” await Maurice’s approval and are hidden on the live site.</div>}
        <Header />
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer />
        <QuickContact email={site.email} />
        <Playground />
        <FloatGuard />
        <PageTransition projectTracks={projectTracks} />
      </body>
    </html>
  );
}
