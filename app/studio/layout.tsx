import type { Metadata } from "next";

export const metadata: Metadata = { title: "Studio", robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div className="studio-wrap st">{children}</div>;
}
