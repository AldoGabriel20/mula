import type { CSSProperties } from "react";
import { SANS, SERIF, fam } from "./fonts";

export type InviteData = {
  bg: string;
  fg: string;
  accent: string;
  font?: string;
  italic?: string;
  weight?: number;
  ls?: string;
  size?: number;
  eyebrow?: string;
  title?: string;
  sub?: string;
  variant?: "cover" | "ring" | "arch" | "numeral" | "frame" | "photo";
  numeral?: string;
  numFont?: string;
  photo?: string;
  date?: string;
  guest?: string;
  guestLabel?: string;
};

const abs: CSSProperties = { position: "absolute" };

// Phone-framed invitation preview. Port of InviteScreen.dc.html: every dimension is in cqw so the
// whole device scales with its container.
export function InviteScreen({ d: input }: { d: Partial<InviteData> }) {
  const d = { italic: "normal", weight: 400, ls: "-0.01em", size: 12, font: "'Cormorant Garamond', serif", guestLabel: "Dear", bg: "#EFE7DA", fg: "#2B2420", accent: "#A88452", ...input } as InviteData & { italic: string; weight: number; ls: string; size: number; font: string; guestLabel: string };
  const font = fam(d.font);
  const numFont = fam(d.numFont || d.font);
  const titleSize = d.variant === "photo" ? d.size * 0.82 : d.size;
  const coverSize = d.size * 1.25;
  const dateShort = (d.date || "").split("·").pop()!.trim().slice(0, 12);
  const cover = d.variant === "cover";
  const v = d.variant;

  return (
    <div style={{ containerType: "inline-size", width: "100%", aspectRatio: "9/19.5", height: "auto", boxSizing: "border-box", padding: "2.6%", background: "#0c0b0a", borderRadius: "15% / 7%", boxShadow: "0 50px 90px -40px rgba(0,0,0,.7), 0 18px 40px -20px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.08)" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "12.5cqw", overflow: "hidden", background: d.bg, color: d.fg, transition: "background-color .9s ease, color .9s ease" }}>
        {cover ? (
          <>
            <div style={{ ...abs, left: 0, right: 0, top: 0, height: "64%", background: d.photo }} />
            <div style={{ ...abs, left: 0, right: 0, top: "34%", height: "32%", background: `linear-gradient(to bottom, rgba(0,0,0,0), ${d.bg})` }} />
            <div style={{ ...abs, left: "8cqw", right: "8cqw", top: "17cqw", display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: "3cqw", fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase" }}>
              <span>{d.eyebrow}</span>
              <span>{dateShort}</span>
            </div>
            <div style={{ ...abs, left: "8cqw", right: "8cqw", bottom: "9cqw", display: "flex", flexDirection: "column", gap: "4cqw" }}>
              <div style={{ fontFamily: font, fontStyle: d.italic, fontWeight: d.weight, fontSize: `${coverSize}cqw`, lineHeight: 0.98, letterSpacing: d.ls, textWrap: "balance" }}>{d.title}</div>
              {d.guest && <div style={{ fontFamily: SANS, fontSize: "3.6cqw", opacity: 0.85 }}>{d.guestLabel} {d.guest}</div>}
              <div style={{ height: 1, background: d.accent, opacity: 0.6 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "3cqw", fontFamily: SANS, fontSize: "3.2cqw" }}>
                <span style={{ opacity: 0.85 }}>{d.date}</span>
                <span style={{ flex: "none", padding: "2.4cqw 5cqw", borderRadius: "10cqw", background: d.fg, color: d.bg }}>Open</span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ ...abs, inset: 0, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxSizing: "border-box", padding: "17cqw 8cqw 8cqw" }}>
            <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: "3cqw", letterSpacing: ".26em", textTransform: "uppercase", opacity: 0.82 }}>{d.eyebrow}</div>
            <div style={{ flex: 1, width: "100%", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6cqw" }}>
              {v === "ring" && (
                <>
                  <div style={{ ...abs, width: "66cqw", height: "66cqw", borderRadius: "50%", border: `1px solid ${d.accent}` }} />
                  <div style={{ ...abs, width: "52cqw", height: "52cqw", borderRadius: "50%", border: `1px solid ${d.accent}`, opacity: 0.45 }} />
                </>
              )}
              {v === "arch" && (
                <>
                  <div style={{ ...abs, width: "60cqw", height: "82cqw", borderRadius: "30cqw 30cqw 0 0", border: `1px solid ${d.accent}` }} />
                  <div style={{ ...abs, width: "52cqw", height: "74cqw", borderRadius: "26cqw 26cqw 0 0", border: `1px solid ${d.accent}`, opacity: 0.4 }} />
                </>
              )}
              {v === "numeral" && (
                <div style={{ ...abs, fontFamily: numFont, fontSize: "78cqw", lineHeight: 1, color: "transparent", WebkitTextStroke: `1px ${d.accent}`, letterSpacing: "-.05em" }}>{d.numeral}</div>
              )}
              {v === "frame" && (
                <>
                  <div style={{ ...abs, inset: "6cqw 0", border: `1px solid ${d.accent}` }} />
                  <div style={{ ...abs, inset: "8cqw 2cqw", border: `1px solid ${d.accent}`, opacity: 0.4 }} />
                </>
              )}
              {v === "photo" && (
                <div style={{ width: "58cqw", height: "68cqw", borderRadius: "29cqw 29cqw 0 0", background: d.photo, boxShadow: `0 0 0 1.4cqw ${d.bg}, 0 0 0 calc(1.4cqw + 1px) ${d.accent}` }} />
              )}
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "3.4cqw" }}>
                <div style={{ fontFamily: font, fontStyle: d.italic, fontWeight: d.weight, fontSize: `${titleSize}cqw`, lineHeight: 1.04, letterSpacing: d.ls, textWrap: "balance", maxWidth: "78cqw" }}>{d.title}</div>
                {d.sub && <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "4.8cqw", opacity: 0.85 }}>{d.sub}</div>}
              </div>
            </div>
            {d.guest && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.4cqw", marginBottom: "5cqw" }}>
                <div style={{ fontFamily: SANS, fontSize: "2.7cqw", letterSpacing: ".22em", textTransform: "uppercase", opacity: 0.65 }}>{d.guestLabel}</div>
                <div style={{ fontFamily: SERIF, fontSize: "5.4cqw", fontWeight: 500 }}>{d.guest}</div>
              </div>
            )}
            <div style={{ width: "10cqw", height: 1, background: d.accent, marginBottom: "4cqw" }} />
            <div style={{ fontFamily: SANS, fontSize: "3.3cqw", letterSpacing: ".04em", opacity: 0.86, marginBottom: "7cqw" }}>{d.date}</div>
            <div style={{ fontFamily: SANS, fontSize: "3.2cqw", letterSpacing: ".08em", padding: "3cqw 7cqw", borderRadius: "10cqw", border: `1px solid ${d.accent}` }}>Open invitation</div>
          </div>
        )}
      </div>
    </div>
  );
}
