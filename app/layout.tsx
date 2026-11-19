import type { Metadata, Viewport } from "next";
import { Archivo_Black, DM_Sans, Fraunces, IBM_Plex_Sans, Instrument_Sans, Manrope, Public_Sans, Saira_Condensed, Space_Grotesk } from "next/font/google";
import { ActionTracker } from "@/components/ActionTracker";
import { Analytics } from "@/components/Analytics";
import { EngagementTracker } from "@/components/EngagementTracker";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { IntroOverlay } from "@/components/IntroOverlay";
import { PageTransition } from "@/components/PageTransition";
import { Playground } from "@/components/play/Playground";
import { ContactRail } from "@/components/ContactActions";
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
 * Fonts, all self-hosted by next/font, only the weights each identity uses. Only the default identity's two faces
 * (SOFTWORKS: Manrope + DM Sans) are preloaded; every other face is declared but preload:false, so the browser fetches
 * it only when a visitor actually switches to a skin that uses it. Semantic tokens (--font-display, --font-sans) are
 * set per identity in app/tokens.css.
 */
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", weight: ["700", "800"] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap", weight: ["400", "600"] });
const saira = Saira_Condensed({ subsets: ["latin"], variable: "--font-saira", display: "swap", weight: ["500", "600", "700", "800"], preload: false });
const plex = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-plex", display: "swap", weight: "variable", preload: false });
const archivoBlack = Archivo_Black({ subsets: ["latin"], variable: "--font-archivo-black", display: "swap", weight: "400", preload: false });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap", weight: "variable", preload: false });
// Space Grotesk is also used by the /lab Neo-Pop demo; load it once here so lab/fonts.ts can reuse the variable.
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", weight: ["400", "500"], preload: false });
// The previous default's faces, kept for the Workshop, Paper, Neo-Pop and Glass skins.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"], preload: false });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap", preload: false });
const fontVars = [manrope, dmSans, saira, plex, archivoBlack, publicSans, spaceGrotesk, fraunces, instrument].map((f) => f.variable).join(" ");

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
        <ContactRail />
        <Playground />
        <FloatGuard />
        <PageTransition projectTracks={projectTracks} />
      </body>
    </html>
  );
}
