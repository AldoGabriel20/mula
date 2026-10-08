"use client";

import { useRef } from "react";
import Link from "next/link";
import { Magnetic, Reveal } from "@/lib/motion";
import { SERIF } from "../fonts";
import { TH, useLang } from "../i18n";
import { useInvitation } from "../useInvitation";

export function FinalCta() {
  const { t, tr } = useLang();
  const canvas = useRef<HTMLCanvasElement>(null);
  useInvitation(canvas, () => ({ mode: "float", layout: (w, h) => ({ x: 0, y: 0, s: Math.min(1.05, (2.545 * (w / h) * 2 * 0.82) / 3.9), rot: 0 }) }));

  return (
    <section data-bg="#0E0C0B" data-screen-label="14 Final CTA" style={{ position: "relative", minHeight: "max(118svh,820px)", background: "#0E0C0B", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", padding: "clamp(110px,15vh,170px) 20px clamp(48px,8vh,88px)" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(46% 42% at 50% 60%, rgba(201,165,110,.16), rgba(14,12,11,0) 70%)" }} />
      <Reveal kind="blur" as="h2" style={{ position: "relative", textAlign: "center", fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(52px,8.4vw,150px)", lineHeight: 0.9, letterSpacing: "-.035em", margin: 0, maxWidth: 1200, color: "#E8D9BF", textWrap: "balance" }}>
        <TH k="home.final.title">{"Everything begins <em>somewhere.</em>"}</TH>
      </Reveal>
      <div style={{ position: "relative", flex: 1, width: "100%", minHeight: "clamp(320px,46vh,560px)" }}>
        <canvas ref={canvas} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 22, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 16, color: "#C8BEB2", maxWidth: 420, lineHeight: 1.6 }}>{tr("Mula is made to celebrate what begins from here.")}</p>
        <Magnetic>
          <Link href="/register" data-cursor="Create" style={{ display: "inline-flex", alignItems: "center", gap: 12, height: 58, padding: "0 32px", borderRadius: 999, background: "#F4EEE4", color: "#0E0C0B", fontSize: 14, fontWeight: 600, transition: "background-color .35s, box-shadow .35s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#E8D9BF"; e.currentTarget.style.boxShadow = "0 10px 50px -10px rgba(201,165,110,.7)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#F4EEE4"; e.currentTarget.style.boxShadow = "none"; }}>
            <span>{t("cta.start", "Start your next beginning")}</span>
            <span data-arrow="1">→</span>
          </Link>
        </Magnetic>
      </div>
    </section>
  );
}
