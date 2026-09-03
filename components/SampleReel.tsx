"use client";

const spots = [
  { src: "/samples/spot-01.mp4", title: "Sample 01", note: "Vertical hook" },
  { src: "/samples/spot-02.mp4", title: "Sample 02", note: "15s local" },
  { src: "/samples/spot-03.mp4", title: "Sample 03", note: "Workshop still in motion" },
];

export function SampleReel() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {spots.map((s) => (
        <figure key={s.src} className="border border-[var(--color-rule)]">
          <video
            src={s.src}
            className="aspect-[9/16] w-full bg-black object-cover"
            autoPlay
            muted
            loop
            playsInline
            controls
          />
          <figcaption className="px-4 py-3">
            <p className="stamp">{s.title}</p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{s.note} · placeholder</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
