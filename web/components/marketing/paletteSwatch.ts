// Palette name → preview gradient (placeholder visuals for template cards).
export const PALETTE: Record<string, { bg: string; fg: string }> = {
  Ivory: { bg: "linear-gradient(165deg,#F5F3EE,#E3DED4)", fg: "#7A6E5E" },
  Stone: { bg: "linear-gradient(165deg,#E7E2DA,#CFC8BB)", fg: "#4A4540" },
  Blush: { bg: "linear-gradient(165deg,#F3E4E0,#E6C9C4)", fg: "#A3462F" },
  Forest: { bg: "linear-gradient(165deg,#DDE4DC,#A9B7A6)", fg: "#4C6A4E" },
  Midnight: { bg: "linear-gradient(165deg,#2A2824,#12110F)", fg: "#CDBFA9" },
};
export const paletteOf = (name: string) => PALETTE[name] ?? PALETTE.Ivory;
