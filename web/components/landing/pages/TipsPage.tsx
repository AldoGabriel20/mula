"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Magnetic, Reveal } from "@/lib/motion";
import { PHOTOS, TIPS } from "../data";
import { SERIF } from "../fonts";
import { Em, PX, WRAP } from "./shared";
import { TH, useLang } from "../i18n";
import { LandingShell } from "../LandingShell";
import s from "../landing.module.css";

const POINTS: Record<string, string[]> = {
  "choose-design": ["Describe the day in three words before you browse, then filter by the mood that matches.", "Pick the template first and the palette second. Structure is harder to change than colour.", "Preview it on your own phone. That is where most guests will see it."],
  "what-to-include": ["Essentials: names, date, start time, venue and how to reply.", "Helpful extras: map link, dress code, schedule, parking and a contact person.", "Leave out anything guests don’t need to arrive well. It can live on a second page."],
  "when-to-send": ["Six to eight weeks for most celebrations, ten to twelve for destination events.", "Set your RSVP deadline two to three weeks before the day.", "Send a gentle reminder one week before the deadline to anyone who has not replied."],
  "guest-experience": ["Greet each guest by name with personal links.", "Keep the first screen simple: who, when, where, and a single button to open.", "Thank guests after they reply. It costs nothing and is always noticed."],
  "choosing-music": ["Instrumental pieces sit under the words without competing with them.", "Choose something that loops gracefully, without a sudden ending.", "Keep the volume low and let guests pause it easily."],
  personalized: ["Personal links raise response rates because guests feel expected.", "You can see exactly who opened the invitation and who still needs a nudge.", "Seat counts per guest keep plus-ones under control."],
};

export function TipsPage({ initialOpen = "" }: { initialOpen?: string }) {
  const { tr } = useLang();
  const [open, setOpen] = useState(initialOpen);
  const [cat, setCat] = useState("All");

  useEffect(() => {
    const h = location.hash.slice(1);
    if (h) setOpen(h);
  }, []);
  useEffect(() => {
    if (!open) return;
    // Prototype opens the tip from the URL hash and the browser scrolls to its article.
    const el = document.getElementById(open);
    if (el && (initialOpen || location.hash.slice(1) === open)) el.scrollIntoView({ block: "start" });
  }, [open, initialOpen]);

  const feat = TIPS[3];
  const cats = ["All", ...TIPS.map((t) => t.cat)];

  return (
    <LandingShell active="tips" bg="#EFE5D3" fg="#0E0C0B" startLight hover="brown" pad={100}>
      <section data-bg="#EFE5D3" data-nav="light" data-screen-label="Tips hero" style={{ background: "#EFE5D3" }}>
        <div style={{ ...WRAP, padding: `clamp(150px,17vw,230px) ${PX} clamp(60px,7vw,100px)`, display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#7A5232" }}>{tr("Tips · Planning something beautiful?")}</div>
          <Reveal kind="blur" as="h1" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(56px,8vw,132px)", lineHeight: 0.9, letterSpacing: "-.035em", margin: 0, maxWidth: 1100 }}>
            <TH k="page.tips.title">{"Little things that make <em>a big difference.</em>"}</TH>
          </Reveal>
        </div>
      </section>

      <section data-bg="#0E0C0B" data-screen-label="Featured tip" style={{ background: "#0E0C0B", color: "#F4EEE4" }}>
        <a href={`#${feat.slug}`} onClick={() => { setOpen(feat.slug); setCat("All"); }} data-cursor="Read" style={{ ...WRAP, display: "grid", padding: `clamp(80px,9vw,130px) ${PX}`, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "40px clamp(40px,6vw,96px)", alignItems: "center", color: "#F4EEE4" }}>
          <Reveal kind="mask" style={{ aspectRatio: "5/4", borderRadius: 4, background: PHOTOS.dusk || "#8C5546", position: "relative" }}>
            <span style={{ position: "absolute", left: 18, top: 18, fontSize: 10, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", background: "rgba(14,12,11,.6)", padding: "6px 10px", borderRadius: 999 }}>{tr("Photo placeholder")}</span>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".24em", textTransform: "uppercase", color: "#C9A56E" }}>{tr("Featured")} · {tr(feat.cat)} · {feat.read}</span>
            <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(40px,4.6vw,74px)", lineHeight: 0.98, letterSpacing: "-.02em", margin: 0 }}>{tr(feat.title)}</h2>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: "#C8BEB2", maxWidth: 480 }}>{tr(feat.excerpt)}</p>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{tr("Read the guide →")}</span>
          </div>
        </a>
      </section>

      <section data-bg="#F4EEE4" data-nav="light" data-screen-label="All tips" style={{ background: "#F4EEE4" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: `clamp(90px,10vw,140px) ${PX}` }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} style={{ height: 36, padding: "0 16px", borderRadius: 999, border: `1px solid ${c === cat ? "#0E0C0B" : "rgba(14,12,11,.18)"}`, background: c === cat ? "#0E0C0B" : "transparent", color: c === cat ? "#F4EEE4" : "#0E0C0B", font: "inherit", fontSize: 13, cursor: "pointer" }}>{tr(c)}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(14,12,11,.16)" }}>
            {TIPS.filter((t) => cat === "All" || t.cat === cat).map((t) => {
              const on = open === t.slug;
              return (
                <article key={t.slug} id={t.slug} style={{ borderBottom: "1px solid rgba(14,12,11,.16)" }}>
                  <button onClick={() => setOpen(on ? "" : t.slug)} aria-expanded={on} style={{ all: "unset", cursor: "pointer", width: "100%", boxSizing: "border-box", display: "grid", gridTemplateColumns: "48px minmax(0,1fr) auto", gap: 16, padding: "32px 0", alignItems: "start" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#8A5F38", paddingTop: 12 }}>{String(TIPS.indexOf(t) + 1).padStart(2, "0")}</span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: "#8A5F38" }}>{tr(t.cat)} · {t.read}</span>
                      <span style={{ fontFamily: SERIF, fontSize: "clamp(28px,3vw,42px)", lineHeight: 1.08 }}>{tr(t.title)}</span>
                    </span>
                    <span style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(14,12,11,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, transform: `rotate(${on ? 45 : 0}deg)`, transition: "transform .4s" }}>+</span>
                  </button>
                  {on && (
                    <div style={{ display: "grid", gridTemplateColumns: "48px minmax(0,1fr)", gap: 16, padding: "0 0 40px" }}>
                      <span />
                      <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 640 }}>
                        <p style={{ margin: 0, fontFamily: SERIF, fontSize: 24, lineHeight: 1.4, color: "#2A241F" }}>{tr(t.excerpt)}</p>
                        <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(14,12,11,.1)" }}>
                          {(POINTS[t.slug] || []).map((p) => (
                            <div key={p} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(14,12,11,.1)", fontSize: 15, lineHeight: 1.55, color: "#3A332D" }}>
                              <span style={{ color: "#B8925F" }}>—</span>
                              {tr(p)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section data-bg="#E8D9BF" data-nav="light" data-screen-label="Tips CTA" style={{ background: "#E8D9BF" }}>
        <div style={{ ...WRAP, padding: `clamp(90px,10vw,140px) ${PX}`, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 32 }}>
          <Reveal kind="blur" as="h2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(42px,5vw,80px)", lineHeight: 0.95, letterSpacing: "-.025em", margin: 0, maxWidth: 760 }}><Em a="Put it into " b="practice." /></Reveal>
          <Magnetic>
            <Link href="/templates" className={s.btnDark} style={{ height: 54, padding: "0 28px" }}>
              <TH k="cta.explore">Explore designs</TH>
              <span data-arrow="1">→</span>
            </Link>
          </Magnetic>
        </div>
      </section>
    </LandingShell>
  );
}
