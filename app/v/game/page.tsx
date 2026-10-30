import type { Metadata } from "next";
import { GameWorld, type Level } from "@/components/versions/GameWorld";
import { toCard } from "@/lib/content/cards";
import { MATURITY_HELP, TRACK_LABELS, projectsByTrack } from "@/lib/content/query";
import "./game.css";

export const metadata: Metadata = {
  title: "Level select",
  description: "Maurice Garcia's portfolio as a game: every project is a level on the map.",
  alternates: { canonical: "/v/game" },
};

const WORLDS = ["experiences", "products", "labs"] as const;

export default function GameVersion() {
  const worlds = WORLDS.map((track, w) => ({
    id: track,
    title: `World ${w + 1}: ${TRACK_LABELS[track].title}`,
    blurb: TRACK_LABELS[track].blurb,
    levels: projectsByTrack(track)
      .sort((a, b) => (a.tier === b.tier ? a.order - b.order : a.tier === "featured" ? -1 : 1))
      .map((p): Level => {
        const c = toCard(p);
        return { slug: c.slug, title: c.title, tagline: c.tagline, state: c.state, stateLabel: c.stateLabel, stateHelp: MATURITY_HELP[c.state], demo: c.demo, featured: c.tier === "featured", game: c.game, image: c.preview?.poster ?? c.image?.src, imageAlt: c.image?.alt ?? "" };
      }),
  })).filter((w) => w.levels.length > 0);
  return <GameWorld worlds={worlds} />;
}
