"use client";

import Link from "next/link";
import { Magnetic, Reveal } from "@/lib/motion";
import { TIERS } from "../data";
import { SERIF } from "../fonts";
import { TH, useLang } from "../i18n";
import s from "../landing.module.css";

export function Pricing() {
  const { t, tr } = useLang();
  return (
    <section data-bg="#F4EEE4" data-nav="light" data-screen-label="13 Pricing" style={{ background: "#F4EEE4", color: "#0E0C0B" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "clamp(110px,13vw,190px) clamp(20px,3.6vw,52px)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#8A5F38" }}>{t("home.pricing.label", "Pricing")}</div>
            <Reveal kind="blur" as="h2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(46px,6vw,96px)", lineHeight: 0.95, letterSpacing: "-.025em", margin: 0 }}>
              <TH k="home.pricing.title">{"One invitation, <em>everything included.</em>"}</TH>
            </Reveal>
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#4A423A", maxWidth: 320 }}>{tr("Pay once per celebration. Prices shown are placeholders until launch pricing is confirmed.")}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 14, marginTop: 64 }}>
          {TIERS.map((tier) => {
            const f = !!tier.featured;
            return (
              <div key={tier.key} style={{ display: "flex", flexDirection: "column", gap: 24, padding: "clamp(26px,2.8vw,40px)", borderRadius: 6, background: f ? "#0E0C0B" : "transparent", color: f ? "#F4EEE4" : "#0E0C0B", border: `1px solid ${f ? "#0E0C0B" : "rgba(14,12,11,.16)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: SERIF, fontSize: 32 }}>{tr(tier.name)}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".18em", padding: "6px 10px", borderRadius: 999, background: "#C9A56E", color: "#0E0C0B", opacity: f ? 1 : 0 }}>{tr("MOST CHOSEN")}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 56, lineHeight: 1, letterSpacing: "-.02em" }}>{tier.price === "Let’s talk" ? tr("Let’s talk") : tier.price}</span>
                  <span style={{ fontSize: 14, color: f ? "#B5AA9E" : "#5E554C" }}>{tr(tier.note)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
                  {tier.items.slice(0, 3).map((it) => (
                    <span key={it} style={{ display: "flex", gap: 10 }}>
                      <span style={{ color: "#C9A56E" }}>—</span>
                      {tr(it)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
          <Magnetic>
            <Link href="/pricing" className={s.btnDark}>
              <span>{t("cta.plan", "Choose your plan")}</span>
              <span data-arrow="1">→</span>
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
