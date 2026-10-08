"use client";

import Link from "next/link";
import { Reveal, Magnetic } from "@/lib/motion";
import { LANGS, TH, useLang } from "./i18n";
import { SANS, SERIF } from "./fonts";
import s from "./landing.module.css";

const HEAD = { fontSize: 11, fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase", color: "#9C9186", marginBottom: 6 } as const;
const COL = { display: "flex", flexDirection: "column", gap: 12 } as const;

// Port of MulaFooter.dc.html. Links that had no target in the prototype (#about, #terms, social…)
// point at the existing marketing routes where one exists, otherwise stay inert anchors.
export function LandingFooter() {
  const { lang, setLang, t, tr } = useLang();
  return (
    <footer data-bg="#0E0C0B" style={{ position: "relative", background: "#0E0C0B", color: "#F4EEE4", fontFamily: SANS, overflow: "hidden" }}>
      <div aria-hidden="true" style={{ position: "absolute", left: "50%", top: 0, width: "min(1100px,120vw)", height: 520, transform: "translate(-50%,-40%)", background: "radial-gradient(closest-side, rgba(201,165,110,.12), rgba(14,12,11,0))", pointerEvents: "none" }} />
      <div style={{ position: "relative", maxWidth: 1440, margin: "0 auto", padding: "clamp(110px,13vw,190px) clamp(20px,3.6vw,52px) 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, fontWeight: 600, letterSpacing: ".3em", color: "#C9A56E" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#A89A88" }} />
          {tr("THE LAST PAGE")}
        </div>
        <Reveal kind="blur" as="h2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(50px,8vw,132px)", lineHeight: 0.94, letterSpacing: "-.03em", margin: "30px 0 0", maxWidth: 1180, textWrap: "balance" }}>
          <TH k="footer.statement">{"Every beginning deserves <em>a beautiful story.</em>"}</TH>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 48 }}>
          <Magnetic>
            <Link href="/register" data-cursor="Create" className={s.btnLight}>
              <span>{t("cta.start", "Start your next beginning")}</span>
              <span data-arrow="1">→</span>
            </Link>
          </Magnetic>
          <Link href="/templates" className={s.btnGhost} style={{ padding: "0 30px", borderColor: "rgba(244,238,228,.24)", backdropFilter: "none" }}>
            <span>{t("cta.explore", "Explore designs")}</span>
          </Link>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "56px clamp(40px,6vw,96px)", marginTop: "clamp(90px,10vw,150px)", paddingTop: 56, borderTop: "1px solid rgba(244,238,228,.1)" }}>
          <div style={{ flex: "1 1 240px", maxWidth: 340, display: "flex", flexDirection: "column", gap: 22 }}>
            <Link href="/" aria-label="Mula home" style={{ display: "block", width: "clamp(150px,14vw,200px)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/mula-lockup-light.png" alt="Mula" style={{ display: "block", width: "100%", height: "auto" }} />
            </Link>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#B5AA9E" }}>{tr("Digital invitations for the moments where something begins.")}</p>
          </div>
          <div style={{ flex: "3 1 520px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,136px),1fr))", gap: "40px 24px", fontSize: 14 }}>
            <div style={COL}>
              <span style={HEAD}>{t("footer.product", "Product")}</span>
              <Link href="/templates">{t("nav.templates", "Templates")}</Link>
              <Link href="/features">{t("nav.features", "Features")}</Link>
              <Link href="/pricing">{t("nav.pricing", "Pricing")}</Link>
              <Link href="/inspiration">{t("nav.inspiration", "Inspiration")}</Link>
              <Link href="/tips">{t("nav.tips", "Tips")}</Link>
            </div>
            <div style={COL}>
              <span style={HEAD}>{t("footer.company", "Company")}</span>
              <Link href="/about">{tr("About")}</Link>
              <Link href="/contact">{tr("Contact")}</Link>
              <Link href="/faq">{tr("FAQ")}</Link>
              <Link href="/terms">{tr("Terms")}</Link>
              <Link href="/privacy">{tr("Privacy")}</Link>
            </div>
            <div style={COL}>
              <span style={HEAD}>{t("footer.social", "Social")}</span>
              <a href="#instagram">Instagram</a>
              <a href="#tiktok">TikTok</a>
              <a href="#youtube">YouTube</a>
              <a href="#pinterest">Pinterest</a>
            </div>
            <div style={COL}>
              <span style={HEAD}>{t("footer.support", "Support")}</span>
              <Link href="/help">{tr("Help Center")}</Link>
              <a href="#whatsapp">WhatsApp</a>
              <a href="#email">{tr("Email")}</a>
            </div>
            <div style={COL}>
              <span style={HEAD}>{t("footer.language", "Language")}</span>
              {LANGS.map((g) => (
                <button key={g.code} onClick={() => setLang(g.code)} aria-pressed={g.code === lang} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: g.code === lang ? "#F4EEE4" : "#B5AA9E" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#A89A88", opacity: g.code === lang ? 1 : 0 }} />
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "14px 28px", marginTop: 72, padding: "26px 0 34px", borderTop: "1px solid rgba(244,238,228,.08)", fontSize: 12.5, color: "#9C9186" }}>
          <span>© 2026 Mula. All rights reserved.</span>
          <span>Secure payments · QRIS · Bank transfer · E-wallet · Cards</span>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: "#B5AA9E" }}>Everything begins somewhere.</span>
        </div>
      </div>
    </footer>
  );
}
