"use client";

import { useRef } from "react";
import Link from "next/link";
import { InviteScreen } from "../InviteScreen";
import { BY_SLUG, CATEGORIES } from "../data";
import { SERIF } from "../fonts";
import { TH, useLang } from "../i18n";
import { clamp, useIsMobile, useScrollTick } from "../hooks";
import s from "../landing.module.css";

// Desktop: the section is as tall as the horizontal track needs and a sticky stage translates the
// track sideways with scroll. Mobile: a plain scroll-snap row.
export function Categories() {
  const { t, tr } = useLang();
  const mobile = useIsMobile();
  const sec = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useScrollTick(() => {
    const se = sec.current, tr_ = track.current;
    if (!se || !tr_) return;
    const vh = innerHeight, vw = innerWidth;
    if (innerWidth >= 900) {
      const tw = tr_.offsetWidth, need = Math.max(vh, tw - vw + vh);
      se.style.height = need + "px";
      const r = se.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, need - vh));
      tr_.style.transform = `translate3d(${(-p * Math.max(0, tw - vw)).toFixed(1)}px,0,0)`;
    } else {
      se.style.height = "";
      tr_.style.transform = "none";
    }
  });

  return (
    <section ref={sec} data-bg="#171412" data-screen-label="09 Categories" style={{ position: "relative", background: "#171412", color: "#F4EEE4" }}>
      <div style={{ position: mobile ? "relative" : "sticky", top: 0, height: mobile ? "auto" : "100svh", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", gap: "clamp(24px,4vh,48px)", padding: "96px 0 40px" }}>
        <div style={{ maxWidth: 1440, width: "100%", margin: "0 auto", padding: "0 clamp(20px,3.6vw,52px)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#C9A56E" }}>{t("home.cats.label", "For every beginning")}</div>
            <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(40px,4.6vw,76px)", lineHeight: 0.95, letterSpacing: "-.025em", margin: 0, maxWidth: 900 }}>
              <TH k="home.cats.title">{"A new age, a new chapter, <em>a new adventure.</em>"}</TH>
            </h2>
          </div>
          <span style={{ fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", color: "#9C9186" }}>{tr("09 occasions")}</span>
        </div>
        <div className={s.hideScroll} style={{ overflowX: mobile ? "auto" : "visible", scrollSnapType: "x mandatory" }}>
          <div ref={track} style={{ display: "flex", gap: 16, width: "max-content", padding: "0 clamp(20px,3.6vw,52px)", willChange: "transform" }}>
            {CATEGORIES.map((c, i) => {
              const tp = BY_SLUG[c.slug];
              return (
                <Link key={c.name} href="/templates" data-cursor="View" className={s.catCard} style={{ position: "relative", flex: "none", width: mobile ? "80vw" : "clamp(320px,30vw,440px)", height: "min(62vh,600px)", minHeight: 420, borderRadius: 6, overflow: "hidden", background: c.bg, color: c.fg, display: "flex", flexDirection: "column", padding: 28, scrollSnapAlign: "start" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, letterSpacing: ".2em", opacity: 0.8 }}>
                    <span>{String(i + 1).padStart(2, "0")} / 09</span>
                    <span>{tp.name}</span>
                  </div>
                  <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(36px,3.2vw,52px)", lineHeight: 0.95, letterSpacing: "-.02em", marginTop: 22, maxWidth: "80%" }}>{tr(c.name)}</div>
                  <div style={{ fontSize: 14, opacity: 0.82, marginTop: 12, maxWidth: "62%" }}>{tr(c.line)}</div>
                  <div style={{ position: "absolute", right: "-6%", bottom: "-24%", width: "54%", aspectRatio: "9/19.5", transform: "rotate(-6deg)" }}><InviteScreen d={tp.d} /></div>
                  <span style={{ marginTop: "auto", fontSize: 13, fontWeight: 600, display: "flex", gap: 8, position: "relative" }}>{tr("Explore")} <span>→</span></span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
