import { SERIF } from "../type";

/** The wax medallion with the couple's monogram (RSVP thank-you card, closing portrait). */
export function WaxSeal({ ini1, ini2, size, font, style }: { ini1: string; ini2: string; size: number; font: number; style?: React.CSSProperties }) {
  return (
    <div aria-hidden="true" style={{ position: "relative", width: size, height: size, borderRadius: "49% 51% 47% 53% / 52% 48% 52% 48%", background: "radial-gradient(circle at 34% 28%,#D2A9A2 0%,#AE7A73 38%,#8A5752 72%,#6E423E 100%)", boxShadow: "0 10px 18px rgba(70,35,30,.32),inset 0 2px 3px rgba(255,225,215,.45),inset 0 -4px 8px rgba(60,25,22,.45)", display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
      <span style={{ position: "absolute", inset: "13%", borderRadius: "50%", border: "1px solid rgba(255,228,218,.35)" }} />
      <span style={{ position: "relative", fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: font, color: "#F2DED6", textShadow: "0 -1px 0 rgba(60,25,22,.55)" }}>
        {ini1}
        <span style={{ fontSize: ".62em", padding: "0 .08em" }}>&amp;</span>
        {ini2}
      </span>
    </div>
  );
}
