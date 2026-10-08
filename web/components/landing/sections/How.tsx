"use client";

import { Reveal } from "@/lib/motion";
import { SERIF } from "../fonts";
import { TH, useLang } from "../i18n";
import s from "../landing.module.css";

const STEPS = [
  { n: "i.", title: "Choose a design", body: "Browse by occasion and style, and preview every template on your own phone before deciding.", pad: "36px 32px 36px 0", br: true, wait: 0 },
  { n: "ii.", title: "Make it yours", body: "Add names, photos, wording, schedule and music in a guided editor that previews every change live.", pad: "36px 32px", br: true, wait: 120 },
  { n: "iii.", title: "Share and manage", body: "Send personal links through WhatsApp, then follow opens and RSVPs as they come in.", pad: "36px 0 36px 32px", br: false, wait: 240 },
];

export function How() {
  const { t, tr } = useLang();
  return (
    <section id="how" data-bg="#F4EEE4" data-nav="light" data-screen-label="10 How it works" style={{ background: "#F4EEE4", color: "#0E0C0B" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "clamp(110px,13vw,190px) clamp(20px,3.6vw,52px)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#8A5F38" }}>{t("home.how.label", "How it works")}</div>
            <Reveal kind="blur" as="h2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(46px,6vw,96px)", lineHeight: 0.95, letterSpacing: "-.025em", margin: 0 }}>
              <TH k="home.how.title">{"Three steps to <em>every guest.</em>"}</TH>
            </Reveal>
          </div>
          <a href="#how" className={s.textLink}>
            <span>{t("cta.how", "See how it works")}</span>
            <span>→</span>
          </a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 0, marginTop: 72, borderTop: "1px solid rgba(14,12,11,.14)" }}>
          {STEPS.map((st) => (
            <Reveal key={st.n} wait={st.wait} style={{ display: "flex", flexDirection: "column", gap: 18, padding: st.pad, borderRight: st.br ? "1px solid rgba(14,12,11,.1)" : undefined }}>
              <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 96, lineHeight: 0.8, color: "#B8925F" }}>{st.n}</span>
              <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 34, letterSpacing: "-.01em", margin: 0 }}>{tr(st.title)}</h3>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: "#4A423A" }}>{tr(st.body)}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
