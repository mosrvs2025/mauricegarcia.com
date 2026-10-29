import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Skin } from "@/components/lab/Skins";
import { SkinNav } from "@/components/lab/SkinNav";
import { labData } from "@/lib/lab/data";
import { SKINS, skinById } from "@/lib/lab/skins";

export const dynamicParams = false;
export const generateStaticParams = () => SKINS.map((s) => ({ skin: s.id }));

export async function generateMetadata({ params }: { params: Promise<{ skin: string }> }): Promise<Metadata> {
  const s = skinById((await params).skin);
  return s ? { title: `${s.name} · Design lab`, description: s.vibe, alternates: { canonical: `/lab/${s.id}` } } : {};
}

export default async function SkinPage({ params }: { params: Promise<{ skin: string }> }) {
  const skin = skinById((await params).skin);
  if (!skin) notFound();
  return (
    <div className={`lab-skin lab-${skin.id}`}>
      <SkinNav current={skin.id} />
      <Skin id={skin.id} data={labData()} />
      <p className="lab-note">Design demo using the real projects and updates from this site. <a href="/lab">See the other styles</a> or <a href="/connect?intent=paid-work">talk to me about a site like this</a>.</p>
    </div>
  );
}
