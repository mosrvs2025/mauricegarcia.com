import Image from "next/image";
import Link from "next/link";
import { SKINS } from "@/lib/lab/skins";

export default function LabIndex() {
  return (
    <div className="studio-wrap" style={{ paddingBottom: 90 }}>
      <header className="j-page-head">
        <p className="eyebrow">Design lab</p>
        <h1 className="display">One site, six personalities</h1>
        <p className="lede">Same projects, same words, six very different looks. Open one to see a full page, and use ‹ › to hop between them. If you're thinking about a website for your business, this is the range of what's possible, and I can build any of these or something entirely your own.</p>
        <p className="j-actions"><Link className="btn btn-fill" href="/connect?intent=paid-work">I want a site like one of these</Link><Link className="j-link j-arrow" href="/services">How I work</Link></p>
      </header>
      <ul className="lab-grid">
        {SKINS.map((s, i) => (
          <li key={s.id} style={{ "--i": i } as React.CSSProperties}>
            <Link href={`/lab/${s.id}`} className="lab-card">
              <div className="lab-shot"><Image src={`/lab/${s.id}.webp`} alt={`Preview of the ${s.name} design`} width={800} height={500} sizes="(max-width:760px) 100vw, 33vw" loading={i < 3 ? "eager" : "lazy"} /></div>
              <div className="lab-meta">
                <h2 className="display">{s.name}</h2>
                <p>{s.vibe}</p>
                <p className="lab-good"><b>Good for:</b> {s.goodFor}</p>
                <p className="lab-sw" aria-label={`Palette: ${s.swatches.join(", ")}`}>{s.swatches.map((c) => <i key={c} style={{ background: c }} />)}<span>{s.type}</span></p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
