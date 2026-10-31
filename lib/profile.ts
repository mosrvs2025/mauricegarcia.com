/**
 * Career facts shown on the home page. A stat is displayed only when its status is "confirmed":
 * the owner stated it in their own words and it is safe to say publicly (no client names, no NDA figures).
 * Leave dollar figures "pending" until the owner supplies an exact, defensible number.
 */
export type Stat = { value: string; label: string; status: "confirmed" | "pending"; note: string };

export const career = {
  headline: "A decade in fintech. Now building what's next.",
  story: [
    "For more than ten years I worked in fintech, where software has to be right, secure and fast, and where a mistake costs real money.",
    "That's where I sharpened my skills in AI and automation: turning slow, manual, error-prone work into systems that run on their own. Now I bring that discipline to everything I build, from business software to games.",
  ],
};

export const careerStats: Stat[] = [
  { value: "10+", label: "years in fintech", status: "confirmed", note: "Owner stated, 2026-10-31." },
  { value: "", label: "in fraud prevented", status: "pending", note: "Owner mentioned fraud savings in the millions; awaiting an exact figure that can be said publicly." },
  { value: "", label: "saved for businesses", status: "pending", note: "Owner mentioned savings in the billions; awaiting an exact, attributable figure." },
];

export const confirmedStats = () => careerStats.filter((s) => s.status === "confirmed" && s.value);
