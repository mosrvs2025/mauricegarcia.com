import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { ActionTracker } from "@/components/ActionTracker";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { QuickContact } from "@/components/QuickContact";
import { isPreviewBuild } from "@/lib/content/visibility";
import { SKIN_BOOT_SCRIPT } from "@/lib/skin";
import { ldScript, personLd, websiteLd } from "@/lib/jsonld";
import { site } from "@/lib/site";
import "./globals.css";
import "./journal.css";
import "./skins.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });

export const viewport: Viewport = { themeColor: "#12100d", colorScheme: "dark" };

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s · Maurice Garcia" },
  description: site.description,
  alternates: {
    canonical: "./",
    types: { "application/rss+xml": [{ url: "/writing/rss.xml", title: "Maurice Garcia: writing" }, { url: "/updates/rss.xml", title: "Maurice Garcia: updates" }] },
  },
  openGraph: { title: site.title, description: site.description, siteName: site.name, locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${instrument.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: SKIN_BOOT_SCRIPT }} /></head>
      <body className="min-h-screen antialiased">
        <a href="#main" className="skip-link">Skip to content</a>
        <Analytics />
        <ActionTracker />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(personLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(websiteLd()) }} />
        {isPreviewBuild() && <div className="j-banner" role="status">Preview build: items marked “Proposed” await Maurice’s approval and are hidden on the live site.</div>}
        <Header />
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer />
        <QuickContact email={site.email} />
      </body>
    </html>
  );
}
