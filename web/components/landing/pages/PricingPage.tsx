"use client";

import { useState } from "react";
import Link from "next/link";
import { Magnetic, Reveal } from "@/lib/motion";
import { TIERS } from "../data";
import { SERIF } from "../fonts";
import { Em, PX, WRAP } from "./shared";
import { TH, useLang } from "../i18n";
import { LandingShell } from "../LandingShell";

const Y = "✓", N = "—";
const ROWS: [string, string, string, string][] = [
  ["Invitation creation", Y, Y, Y], ["Templates", "Essential selection", "Full collection", "Designed for you"], ["Customization", "Text, photos, colours", "Everything, incl. type", "Brand guidelines"],
  ["RSVP", Y, Y, Y], ["Personalized guest links", N, Y, Y], ["Guest management", "Basic list", "Groups, seats, status", "Groups, seats, status"],
  ["WhatsApp sharing", "Single link", "Personal messages", "Personal messages"], ["Music, gallery, countdown", N, Y, Y], ["Digital gifts and wishes", N, Y, Y],
  ["Custom domain", N, N, Y], ["Event analytics", N, N, Y], ["Support", "Email", "Priority", "Dedicated"],
];
const FAQS: [string, string][] = [
  ["Is it a one-time payment?", "Yes. Each package is paid once per event. There is no subscription to cancel."],
  ["Can I upgrade later?", "You can move from Essential to Signature at any time and pay only the difference."],
  ["Is there a limit on guests?", "No. Invite as many guests as your event needs, on every package."],
  ["Can I edit after sending?", "Yes. Changes appear instantly on the same links, so guests always see the latest details."],
  ["How long does the invitation stay online?", "Your invitation stays live through your event and for a period afterwards. Exact durations will be confirmed with launch pricing."],
  ["What payment methods are accepted?", "QRIS, bank transfer, e-wallets and cards. Final payment partners will be listed at launch."],
];
const col = (v: string) => (v === N ? "#9C8F80" : v === Y ? "#3F6A47" : "#0E0C0B");
const ROW = { display: "grid", gridTemplateColumns: "minmax(0,1.4fr) repeat(3,minmax(0,1fr))", gap: 12 } as const;
const H2 = { fontFamily: SERIF, fontWeight: 300, lineHeight: 0.95, letterSpacing: "-.025em", margin: 0 } as const;

export function PricingPage() {
  const { t, tr } = useLang();
  const [faq, setFaq] = useState(0);
  return (
    <LandingShell active="pricing" bg="#F4EEE4" fg="#0E0C0B" startLight hover="brown">
      <section data-bg="#F4EEE4" data-nav="light" data-screen-label="Pricing hero" style={{ background: "#F4EEE4" }}>
        <div style={{ ...WRAP, padding: `clamp(150px,17vw,230px) ${PX} 64px`, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#8A5F38" }}>{tr("Pricing")}</div>
            <Reveal kind="blur" as="h1" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(56px,8vw,132px)", lineHeight: 0.9, letterSpacing: "-.035em", margin: 0, maxWidth: 1000 }}>
              <TH k="page.pricing.title">{"Simple pricing, <em>per celebration.</em>"}</TH>
            </Reveal>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#4A423A", maxWidth: 340 }}>
            {tr("Pay once for each event. No subscription and no per-guest fees.")} <strong style={{ fontWeight: 600 }}>{tr("Prices shown are placeholders")}</strong> {tr("until launch pricing is confirmed.")}
          </p>
        </div>
      </section>

      <section data-bg="#F4EEE4" data-nav="light" data-screen-label="Plans" style={{ background: "#F4EEE4" }}>
        <div style={{ ...WRAP, padding: `0 ${PX} clamp(100px,12vw,160px)`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 14, alignItems: "stretch" }}>
          {TIERS.map((tier) => {
            const f = !!tier.featured;
            const custom = tier.key === "custom";
            return (
              <div key={tier.key} style={{ display: "flex", flexDirection: "column", gap: 28, padding: "clamp(28px,3vw,44px)", borderRadius: 6, background: f ? "#0E0C0B" : "transparent", color: f ? "#F4EEE4" : "#0E0C0B", border: `1px solid ${f ? "#0E0C0B" : "rgba(14,12,11,.16)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: SERIF, fontSize: 36 }}>{tr(tier.name)}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".18em", padding: "6px 10px", borderRadius: 999, background: "#C9A56E", color: "#0E0C0B", opacity: f ? 1 : 0 }}>{tr("MOST CHOSEN")}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 64, lineHeight: 1, letterSpacing: "-.02em" }}>{tier.price === "Let’s talk" ? tr("Let’s talk") : tier.price}</span>
                  <span style={{ fontSize: 14, color: f ? "#B5AA9E" : "#5E554C" }}>{tr(tier.note)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${f ? "rgba(244,238,228,.12)" : "rgba(14,12,11,.1)"}` }}>
                  {tier.items.map((it) => (
                    <div key={it} style={{ display: "flex", gap: 12, padding: "13px 0", borderBottom: `1px solid ${f ? "rgba(244,238,228,.12)" : "rgba(14,12,11,.1)"}`, fontSize: 14.5 }}>
                      <span style={{ color: "#C9A56E" }}>—</span>
                      {tr(it)}
                    </div>
                  ))}
                </div>
                <Magnetic style={{ marginTop: "auto", display: "flex" }}>
                  <Link href={custom ? "/contact" : "/register"} style={{ flex: 1, height: 54, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 14, fontWeight: 600, background: f ? "#F4EEE4" : "transparent", color: f ? "#0E0C0B" : "#0E0C0B", border: `1px solid ${f ? "#F4EEE4" : "rgba(14,12,11,.3)"}` }}>
                    {custom ? tr("Talk to us") : t("cta.plan", "Choose your plan")}
                    <span data-arrow="1">→</span>
                  </Link>
                </Magnetic>
              </div>
            );
          })}
        </div>
      </section>

      <section data-bg="#E8D9BF" data-nav="light" data-screen-label="Compare" style={{ background: "#E8D9BF" }}>
        <div style={{ ...WRAP, padding: `clamp(100px,12vw,160px) ${PX}` }}>
          <Reveal kind="blur" as="h2" style={{ ...H2, fontSize: "clamp(44px,5.6vw,90px)", margin: "0 0 56px" }}><Em a="Compare " b="everything." /></Reveal>
          <div style={{ overflowX: "auto" }}>
            <div role="table" aria-label="Plan comparison" style={{ minWidth: 640, fontSize: 14.5 }}>
              <div role="row" style={{ ...ROW, paddingBottom: 18 }}>
                <span role="columnheader" />
                {["Essential", "Signature", "Custom"].map((n) => <span key={n} role="columnheader" style={{ fontFamily: SERIF, fontSize: 26 }}>{tr(n)}</span>)}
              </div>
              {ROWS.map(([k, a, b, c]) => (
                <div key={k} role="row" style={{ ...ROW, padding: "16px 0", borderTop: "1px solid rgba(14,12,11,.14)" }}>
                  <span role="rowheader" style={{ fontWeight: 500 }}>{tr(k)}</span>
                  <span role="cell" style={{ color: col(a) }}>{tr(a)}</span>
                  <span role="cell" style={{ color: col(b) }}>{tr(b)}</span>
                  <span role="cell" style={{ color: col(c) }}>{tr(c)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" data-bg="#F4EEE4" data-nav="light" data-screen-label="FAQ" style={{ background: "#F4EEE4" }}>
        <div style={{ ...WRAP, padding: `clamp(100px,12vw,160px) ${PX}`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))", gap: "48px clamp(40px,7vw,120px)", alignItems: "start" }}>
          <Reveal kind="blur" as="h2" style={{ ...H2, fontSize: "clamp(44px,5.6vw,86px)" }}><Em a="Questions, " b="answered." /></Reveal>
          <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(14,12,11,.14)" }}>
            {FAQS.map(([q, a], i) => {
              const open = faq === i;
              return (
                <div key={q} style={{ borderBottom: "1px solid rgba(14,12,11,.14)" }}>
                  <button onClick={() => setFaq(open ? -1 : i)} aria-expanded={open} style={{ all: "unset", cursor: "pointer", width: "100%", boxSizing: "border-box", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, padding: "24px 0", fontFamily: SERIF, fontSize: "clamp(21px,1.9vw,26px)" }}>
                    <span>{tr(q)}</span>
                    <span style={{ flex: "none", width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(14,12,11,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--l-manrope), sans-serif", fontSize: 15, transform: `rotate(${open ? 45 : 0}deg)`, transition: "transform .4s" }}>+</span>
                  </button>
                  {open && <p style={{ margin: 0, padding: "0 56px 26px 0", fontSize: 15.5, lineHeight: 1.65, color: "#4A423A" }}>{tr(a)}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
