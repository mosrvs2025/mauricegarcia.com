import Link from "next/link";
import { SKINS, type SkinId } from "@/lib/lab/skins";

/** Floating bar on every style demo: back to the lab, and hop between styles. */
export function SkinNav({ current }: { current: SkinId }) {
  const i = SKINS.findIndex((s) => s.id === current);
  const prev = SKINS[(i + SKINS.length - 1) % SKINS.length], next = SKINS[(i + 1) % SKINS.length];
  return (
    <nav className="lab-nav" aria-label="Design lab">
      <Link href="/lab">← All designs</Link>
      <span className="lab-now">{SKINS[i].name}</span>
      <span className="lab-hop"><Link href={`/lab/${prev.id}`} aria-label={`Previous style: ${prev.name}`}>‹</Link><Link href={`/lab/${next.id}`} aria-label={`Next style: ${next.name}`}>›</Link></span>
    </nav>
  );
}
