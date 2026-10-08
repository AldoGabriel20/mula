"use client";

import { useRef } from "react";
import { useLang, type Lang } from "../i18n";
import { SANS, SERIF } from "../fonts";
import { clamp, useScrollTick } from "../hooks";

// Verbatim from Home.dc.html INTRO. '#sw' = three swatches, '#dear:' / '#att:' = inline pills.
const INTRO: Record<Lang, string[]> = {
  en: ["Mula is a digital invitation platform. Choose a design", "#sw", "made for your moment, make it entirely yours, then send a personal invitation", "#dear:Dear Sarah", "to every guest and watch each reply", "#att:✓ Attending · 2", "arrive in one place."],
  id: ["Mula adalah platform undangan digital. Pilih desain", "#sw", "yang dibuat untuk momenmu, jadikan sepenuhnya milikmu, lalu kirim undangan personal", "#dear:Kepada Sarah", "ke setiap tamu dan lihat setiap balasan", "#att:✓ Hadir · 2", "terkumpul di satu tempat."],
  my: ["Mula ialah platform jemputan digital. Pilih reka bentuk", "#sw", "yang dicipta untuk detik anda, jadikan ia milik anda sepenuhnya, kemudian hantar jemputan peribadi", "#dear:Kepada Sarah", "kepada setiap tetamu dan lihat setiap balasan", "#att:✓ Hadir · 2", "tiba di satu tempat."],
};
type Tok = { kind: "w" | "sw" | "dear" | "att"; w?: string };

const WORD: React.CSSProperties = { opacity: 0.16, transition: "opacity .35s linear" };
const PILL: React.CSSProperties = { display: "inline-flex", verticalAlign: "middle", alignItems: "center", margin: "0 .3em 0 0", padding: ".12em .5em", borderRadius: 999, fontFamily: SANS, fontSize: ".36em", transform: "translateY(-6px)", ...WORD };

export function Intro() {
  const { lang, t } = useLang();
  const root = useRef<HTMLParagraphElement>(null);

  const tokens: Tok[] = [];
  INTRO[lang].forEach((part) => {
    if (part === "#sw") tokens.push({ kind: "sw" });
    else if (part.startsWith("#dear:")) tokens.push({ kind: "dear", w: part.slice(6) });
    else if (part.startsWith("#att:")) tokens.push({ kind: "att", w: part.slice(5) });
    else part.split(" ").forEach((w) => tokens.push({ kind: "w", w: w + " " }));
  });

  // Words light up as the paragraph scrolls through (prototype tick()).
  useScrollTick(() => {
    const el = root.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>("[data-w]");
    const r = el.getBoundingClientRect(), vh = innerHeight;
    const p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.25));
    const lit = p * words.length * 1.12;
    words.forEach((w, i) => {
      const o = (0.16 + 0.84 * clamp(lit - i)).toFixed(2);
      if (w.style.opacity !== o) w.style.opacity = o;
    });
  });

  return (
    <section data-bg="#F4EEE4" data-nav="light" data-screen-label="02 Intro" style={{ background: "#F4EEE4", color: "#0E0C0B" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "clamp(120px,15vw,220px) clamp(20px,3.6vw,52px) clamp(100px,12vw,180px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#8A5F38", paddingTop: 18 }}>{t("home.intro.label", "What is Mula")}</div>
        <p ref={root} style={{ gridColumn: "span 3", minWidth: "min(100%,640px)", margin: 0, fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(32px,4.1vw,66px)", lineHeight: 1.12, letterSpacing: "-.018em", textWrap: "pretty" }}>
          {tokens.map((k, i) => {
            if (k.kind === "w") return <span key={i} data-w="1" style={WORD}>{k.w}</span>;
            if (k.kind === "sw")
              return (
                <span key={i} data-w="1" style={{ display: "inline-flex", verticalAlign: "middle", gap: 4, margin: "0 .3em 0 0", transform: "translateY(-4px)", ...WORD }}>
                  <span style={{ width: ".62em", height: "1.1em", borderRadius: ".1em", background: "#EFE7DA", boxShadow: "inset 0 0 0 1px rgba(168,132,82,.6)" }} />
                  <span style={{ width: ".62em", height: "1.1em", borderRadius: ".1em", background: "#2B1631" }} />
                  <span style={{ width: ".62em", height: "1.1em", borderRadius: ".1em", background: "#3E1A20" }} />
                </span>
              );
            if (k.kind === "dear") return <span key={i} data-w="1" style={{ ...PILL, background: "#3E1A20", color: "#F1E3D3", fontWeight: 500, letterSpacing: ".02em" }}>{k.w}</span>;
            return <span key={i} data-w="1" style={{ ...PILL, background: "#DDE8DB", color: "#2F5A3A", fontWeight: 600 }}>{k.w}</span>;
          })}
        </p>
      </div>
    </section>
  );
}
