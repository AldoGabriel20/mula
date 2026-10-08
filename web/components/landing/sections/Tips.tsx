"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/lib/motion";
import { TIPS } from "../data";
import { SERIF } from "../fonts";
import { TH, useLang } from "../i18n";
import s from "../landing.module.css";

const BROWN = "#7A5232";

export function Tips() {
  const { t, tr } = useLang();
  const [hover, setHover] = useState(0);
  return (
    <section data-bg="#EFE5D3" data-nav="light" data-screen-label="12 Tips" style={{ background: "#EFE5D3", color: "#0E0C0B" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "clamp(110px,13vw,190px) clamp(20px,3.6vw,52px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: "56px clamp(40px,6vw,100px)", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 26, position: "sticky", top: 120 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: BROWN }}>{t("home.tips.label", "Tips")}</div>
          <Reveal kind="blur" as="h2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(46px,5.4vw,86px)", lineHeight: 0.95, letterSpacing: "-.025em", margin: 0 }}>
            <TH k="home.tips.title">{"Little things that make <em>a big difference.</em>"}</TH>
          </Reveal>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#4F463D", maxWidth: 380 }}>{tr("Planning something beautiful? Short guides from the Mula studio on design, timing and hosting.")}</p>
          <Link href="/tips" className={s.textLink} style={{ alignSelf: "flex-start" }}>{tr("All tips")} <span>→</span></Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(14,12,11,.16)" }}>
          {TIPS.slice(0, 4).map((tp, i) => {
            const on = i === hover;
            return (
              <Link key={tp.slug} href="/tips" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} data-cursor="Read" className={s.tipRow} style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", gap: 16, padding: "28px 0", borderBottom: "1px solid rgba(14,12,11,.16)", alignItems: "start" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: BROWN, paddingTop: 10 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: BROWN }}>{tr(tp.cat)} · {tp.read}</span>
                  <span style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(24px,2.2vw,32px)", lineHeight: 1.12 }}>{tr(tp.title)}</span>
                  <span style={{ fontSize: 15, lineHeight: 1.6, color: "#4F463D", maxHeight: on ? 120 : 0, opacity: on ? 1 : 0, overflow: "hidden", transition: "max-height .6s cubic-bezier(.2,.75,.15,1), opacity .5s" }}>{tr(tp.excerpt)}</span>
                </span>
                <span style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(14,12,11,.25)", display: "flex", alignItems: "center", justifyContent: "center", background: on ? "#0E0C0B" : "transparent", color: on ? "#F4EEE4" : "#0E0C0B", transition: "all .4s" }}>→</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
