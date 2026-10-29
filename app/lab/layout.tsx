import type { Metadata } from "next";
import { labFonts } from "@/lib/lab/fonts";
import "./lab.css";

export const metadata: Metadata = { title: "Design lab", description: "The same website content in six different design directions, to show what's possible." };

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <div className={labFonts}>{children}</div>;
}
