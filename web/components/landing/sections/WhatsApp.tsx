"use client";

import { useRef, useState } from "react";
import { Reveal } from "@/lib/motion";
import { InviteScreen } from "../InviteScreen";
import { BY_SLUG } from "../data";
import { SANS, SERIF } from "../fonts";
import { TH, useLang } from "../i18n";
import { useInView, useInterval } from "../hooks";

const DUR = [1300, 1400, 1700, 900, 3600]; // ms each stage lasts

export function WhatsApp() {
  const { t, tr } = useLang();
  const [ref, inView] = useInView<HTMLElement>();
  const [wa, setWa] = useState(0);
  const acc = useRef(0);

  useInterval(() => {
    acc.current += 100;
    if (acc.current >= DUR[wa]) { acc.current = 0; setWa((wa + 1) % 5); }
  }, 100, inView);

  return (
    <section ref={ref} data-bg="#0E0C0B" data-screen-label="08 WhatsApp" style={{ background: "#0E0C0B", color: "#F4EEE4" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "clamp(110px,13vw,190px) clamp(20px,3.6vw,52px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: 64, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#C9A56E" }}>{t("home.wa.label", "Sharing")}</div>
          <Reveal kind="blur" as="h2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(46px,5.6vw,92px)", lineHeight: 0.95, letterSpacing: "-.025em", margin: 0, textWrap: "balance" }}>
            <TH k="home.wa.title">{"Sent where your guests <em>already are.</em>"}</TH>
          </Reveal>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#B5AA9E", maxWidth: 460 }}>{tr("Mula prepares a WhatsApp message for every guest, with their name and their own link already in place. Send one by one or in batches, then follow who opened it.")}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: "min(380px,100%)", height: 560, borderRadius: 24, overflow: "hidden", background: "#12100F", boxShadow: "0 60px 120px -50px rgba(0,0,0,.9), 0 0 0 1px rgba(244,238,228,.07)", display: "flex", flexDirection: "column" }}>
            <div style={{ height: 64, flex: "none", display: "flex", alignItems: "center", gap: 12, padding: "0 18px", background: "#1A1715", borderBottom: "1px solid rgba(244,238,228,.06)" }}>
              <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#C99A93", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 18, color: "#2A1D1A" }}>S</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Sarah</span>
                <span style={{ fontSize: 11, color: "#9C9186" }}>{wa === 0 ? tr("typing…") : tr("online")}</span>
              </div>
            </div>
            <div style={{ flex: 1, padding: "22px 16px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10, backgroundImage: "radial-gradient(rgba(244,238,228,.035) 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
              <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "#221E1B", fontSize: 13, color: "#C8BEB2", maxWidth: "70%" }}>{tr("Can't wait for the big news!")}</div>
              <div style={{ alignSelf: "flex-end", display: "flex", gap: 4, padding: "12px 14px", borderRadius: 14, background: "#1F4A3D", opacity: wa === 0 ? 1 : 0, transition: "opacity .3s" }}>
                {[0, 0.2, 0.4].map((d) => <span key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#CFE3D8", animation: `mulaDot 1.2s ${d}s infinite` }} />)}
              </div>
              <div style={{ alignSelf: "flex-end", maxWidth: "84%", borderRadius: "14px 14px 4px 14px", background: "#1F4A3D", color: "#EAF3EE", padding: 8, display: "flex", flexDirection: "column", gap: 8, opacity: wa >= 1 ? 1 : 0, transform: `translateY(${wa >= 1 ? 0 : 16}px)`, transition: "opacity .5s ease, transform .7s cubic-bezier(.2,.75,.15,1)" }}>
                <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#173A30", opacity: wa >= 2 ? 1 : 0, maxHeight: wa >= 2 ? 200 : 0, transition: "opacity .5s, max-height .7s cubic-bezier(.2,.75,.15,1)" }}>
                  <div style={{ height: 110, background: "#D9DAD5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 300, fontSize: 30, letterSpacing: "-.04em", color: "#22272A" }}>Rad &amp; Cil</div>
                  <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2, fontSize: 12 }}>
                    <span style={{ fontWeight: 600 }}>You&apos;re invited · Rad &amp; Cil</span>
                    <span style={{ color: "#A9C6B9" }}>mula.co</span>
                  </div>
                  <span style={{ position: "absolute", left: "50%", top: 55, width: 44, height: 44, margin: "-22px 0 0 -22px", borderRadius: "50%", border: "2px solid #EAF3EE", opacity: wa === 3 ? 1 : 0, animation: "mulaPulse 1s infinite" }} />
                </div>
                <div style={{ padding: "4px 6px", fontSize: 13.5, lineHeight: 1.45, whiteSpace: "pre-line" }}>
                  {"Hi Sarah 👋\n\nYou're invited to\nRad & Cil's wedding.\n\nOpen invitation:\n"}
                  <span style={{ color: "#9FD9C0", textDecoration: "underline" }}>mula.co/radandcil/sarah</span>
                </div>
                <div style={{ alignSelf: "flex-end", fontSize: 10, color: "#A9C6B9", padding: "0 6px 2px" }}>19.42 ✓✓</div>
              </div>
            </div>
            <div style={{ height: 58, flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", background: "#1A1715" }}>
              <span style={{ flex: 1, height: 38, borderRadius: 999, background: "#221E1B", display: "flex", alignItems: "center", padding: "0 14px", fontSize: 13, color: "#7D736A" }}>{tr("Message")}</span>
              <span style={{ width: 38, height: 38, borderRadius: "50%", background: "#1F4A3D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>➤</span>
            </div>
            <div style={{ position: "absolute", inset: 0, background: "#D9DAD5", clipPath: wa === 4 ? "circle(150% at 50% 62%)" : "circle(0% at 50% 62%)", transition: "clip-path 1.1s cubic-bezier(.7,0,.2,1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "62%", aspectRatio: "9/19.5" }}><InviteScreen d={{ ...BY_SLUG.linen.d, guest: "Sarah" }} /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
