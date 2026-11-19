import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, IBM_Plex_Sans, Instrument_Sans, Manrope, Outfit, Space_Grotesk, Syne } from "next/font/google";
import { ActionTracker } from "@/components/ActionTracker";
import { Analytics } from "@/components/Analytics";
import { MobileContactRail } from "@/components/ContactActions";
import { EngagementTracker } from "@/components/EngagementTracker";
import { FloatGuard } from "@/components/FloatGuard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { IntroOverlay } from "@/components/IntroOverlay";
import { PageTransition } from "@/components/PageTransition";
import { Playground } from "@/components/play/Playground";
import { listedProjects } from "@/lib/content/query";
import { isPreviewBuild } from "@/lib/content/visibility";
import { ldScript, personLd, websiteLd } from "@/lib/jsonld";
import { INTRO_BOOT_SCRIPT, INTRO_CSS } from "@/lib/motion";
import { site } from "@/lib/site";
import { DEFAULT_SKIN, SKIN_BOOT_SCRIPT, kindOf, skinMeta } from "@/lib/skin";
import "./globals.css";
import "./tokens.css";
import "./journal.css";
import "./skins.css";
import "./identities.css";
import "./motion.css";
import "./play.css";

/*
 * Fonts, all self-hosted by next/font. Only the default identity's two faces (Softworks / open-case: Manrope + DM Sans)
 * are preloaded; every other identity and classic face uses preload: false so inactive skins add zero initial font preload cost.
 */
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", weight: ["700", "800"] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap", weight: ["400", "600"] });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne", display: "swap", weight: ["700", "800"], preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", weight: ["400", "500", "600"], preload: false });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap", weight: ["600", "700"], preload: false });
const plex = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-plex", display: "swap", weight: ["400", "500", "600"], preload: false });
// The previous default's faces, kept for the Workshop, Paper, Neo-Pop, Swiss and Glass classic skins.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"], preload: false });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap", preload: false });
const fontVars = [manrope, dmSans, syne, spaceGrotesk, outfit, plex, fraunces, instrument].map((f) => f.variable).join(" ");

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
        <MobileContactRail email={site.email} />
        <Playground />
        <FloatGuard />
        <PageTransition projectTracks={projectTracks} />
      </body>
    </html>
  );
}
