/** Accent per theme. Chosen to stay legible on the dark background (all above 4.5:1 for text). */
export const THEME_COLORS: Record<string, string> = {
  practical: "#f5b04c",
  "creative-tools": "#b99aff",
  games: "#6ee7a0",
  curiosity: "#5cd6ff",
  retail: "#ff8fb3",
};
export const themeColor = (themes: string[]) => THEME_COLORS[themes[0]] ?? "#ff7a4d";
