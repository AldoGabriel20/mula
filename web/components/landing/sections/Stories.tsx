"use client";

import Link from "next/link";
import { Reveal, Tilt } from "@/lib/motion";
import { PHOTOS } from "../data";
import { SERIF } from "../fonts";
import { TH, useLang } from "../i18n";
import s from "../landing.module.css";

const FIG = { margin: 0, display: "flex", flexDirection: "column", gap: 16, paddingTop: 28, borderTop: "1px solid rgba(20,24,26,.16)" } as const;
const QUOTE = { margin: 0, fontFamily: SERIF, fontWeight: 300, fontSize: 26, lineHeight: 1.25 } as const;

export function Stories() {
  const { t, tr } = useLang();
  return (
    <section data-bg="#D9DAD5" data-nav="light" data-screen-label="11 Stories" style={{ background: "#D9DAD5", color: "#14181A" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "clamp(110px,13vw,190px) clamp(20px,3.6vw,52px)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#4E585B" }}>{t("home.stories.label", "Stories")}</div>
            <Reveal kind="blur" as="h2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(46px,6vw,96px)", lineHeight: 0.95, letterSpacing: "-.025em", margin: 0 }}>
              <TH k="home.stories.title">{"Beginnings, <em>shared.</em>"}</TH>
            </Reveal>
          </div>
          <Link href="/inspiration" className={s.textLink}>{tr("More inspiration")} <span>→</span></Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: "48px clamp(32px,5vw,80px)", marginTop: 72, alignItems: "start" }}>
          <Reveal as="figure" style={{ margin: 0, display: "grid", gridTemplateColumns: "minmax(0,.8fr) minmax(0,1fr)", gap: 28, alignItems: "end" }}>
            <Tilt strength={6} style={{ aspectRatio: "4/5", borderRadius: 4, background: PHOTOS.sea || "#AEB8BC", boxShadow: "0 40px 80px -40px rgba(20,24,26,.6)" }}>{null}</Tilt>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <blockquote style={{ margin: 0, fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(26px,2.4vw,36px)", lineHeight: 1.18, letterSpacing: "-.01em" }}>“{tr("Half our guests replied the same evening. They kept saying the invitation felt exactly like us.")}”</blockquote>
              <figcaption style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontWeight: 600 }}>Rad &amp; Cil</span>
                <span style={{ color: "#4E585B" }}>{tr("Engagement · Linen · placeholder story")}</span>
              </figcaption>
            </div>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <Reveal as="figure" wait={120} style={FIG}>
              <blockquote style={QUOTE}>“{tr("We sent one link to three hundred guests, and every one of them was still greeted by name.")}”</blockquote>
              <figcaption style={{ fontSize: 13, color: "#4E585B" }}>Bram &amp; Sekar · Tenth Anniversary · placeholder story</figcaption>
            </Reveal>
            <Reveal as="figure" wait={200} style={FIG}>
              <blockquote style={QUOTE}>“{tr("Our launch invitation looked like part of the product. It set the tone before anyone arrived.")}”</blockquote>
              <figcaption style={{ fontSize: 13, color: "#4E585B" }}>Atlas team · Product Launch · placeholder story</figcaption>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
