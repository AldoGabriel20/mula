"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Magnetic, Reveal } from "@/lib/motion";
import { TemplateShot } from "../TemplateShot";
import { BY_SLUG, TEMPLATES } from "../data";
import { SERIF } from "../fonts";
import { TH, useLang } from "../i18n";
import { useIsMobile, useScrollTick } from "../hooks";
import s from "../landing.module.css";

const GAL = [
  { slug: "noir", left: "2%", top: "20%", w: "14%", rot: -7, f: 60 },
  { slug: "velvet", left: "16.5%", top: "7%", w: "16.5%", rot: -3, f: 30 },
  { slug: "serenity", left: "36.5%", top: "0%", w: "21%", rot: 0, f: 0, featured: true },
  { slug: "maison", left: "61%", top: "7%", w: "16.5%", rot: 3, f: 30 },
  { slug: "aurum", left: "81.5%", top: "20%", w: "14%", rot: 7, f: 60 },
] as const;
const META = { fontSize: 11, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: "#7A5232" } as const;

export function Gallery() {
  const { t, tr } = useLang();
  const mobile = useIsMobile();
  const [hover, setHover] = useState(-1);
  const els = useRef<(HTMLDivElement | null)[]>([]);

  // Per-card vertical parallax relative to the viewport centre (prototype tick()).
  useScrollTick(() => {
    const vh = innerHeight;
    els.current.forEach((el, i) => {
      if (!el?.parentElement) return;
      const r = el.parentElement.getBoundingClientRect();
      const c = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0,${(-c * GAL[i].f).toFixed(1)}px,0)`;
    });
  });

  return (
    <section data-bg="#E8D9BF" data-nav="light" data-screen-label="04 Templates" style={{ background: "#E8D9BF", color: "#0E0C0B", overflow: "hidden" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "clamp(110px,13vw,190px) clamp(20px,3.6vw,52px) 40px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={META}>{t("home.gallery.label", "The collection")}</div>
          <Reveal kind="blur" as="h2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(46px,6.2vw,100px)", lineHeight: 0.95, letterSpacing: "-.025em", margin: 0, maxWidth: 900 }}>
            <TH k="home.gallery.title">{"Designs that feel <em>like the moment.</em>"}</TH>
          </Reveal>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 340 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#4F463D" }}>{tr("Every template is designed in-house for a specific kind of celebration, then made fully editable by you.")}</p>
          <div style={{ alignSelf: "flex-start" }}>
            <Magnetic>
              <Link href="/templates" className={s.btnDark} style={{ height: 52, padding: "0 26px" }}>
                <span>{t("cta.explore", "Explore designs")}</span>
                <span data-arrow="1">→</span>
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>

      {!mobile && (
        <div style={{ position: "relative", maxWidth: 1400, margin: "0 auto", aspectRatio: "2/1.2" }}>
          {GAL.map((g, i) => {
            const tp = BY_SLUG[g.slug];
            const featured = "featured" in g;
            const active = hover === -1 ? featured : hover === i;
            const hov = active && hover !== -1;
            const dim = hover !== -1 && hover !== i;
            const href = "/templates"; // prototype slugs have no detail route yet (Templates page is out of scope)
            return (
              <div key={g.slug} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)} style={{ position: "absolute", left: g.left, top: g.top, width: g.w, zIndex: active ? 10 : featured ? 5 : 2 }}>
                <div ref={(el) => { els.current[i] = el; }} style={{ willChange: "transform" }}>
                  <Link href={href} data-cursor="Preview" onFocus={() => setHover(i)} aria-label={`${tp.name}, ${tp.cat} template`} className={s.galCard} style={{ transform: `rotate(${hov ? 0 : g.rot}deg) scale(${hov ? 1.07 : 1})`, opacity: dim ? 0.55 : 1, filter: `saturate(${dim ? 0.6 : 1})`, transition: "transform .9s cubic-bezier(.2,.75,.15,1), opacity .6s, filter .6s" }}>
                    <div style={{ width: "100%", aspectRatio: "9/19.5" }}><TemplateShot t={tp} /></div>
                  </Link>
                  <div style={{ position: "absolute", left: "50%", top: "100%", marginTop: 26, transform: `translate(-50%, ${active ? 0 : -10}px)`, opacity: active ? 1 : 0, pointerEvents: active ? "auto" : "none", transition: "opacity .45s ease, transform .6s cubic-bezier(.2,.75,.15,1)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                      <span style={{ fontFamily: SERIF, fontSize: 30 }}>{tp.name}</span>
                      <span style={META}>{`${tp.cat} · ${tp.style}`}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link href={href} style={{ height: 40, padding: "0 18px", borderRadius: 999, border: "1px solid rgba(14,12,11,.3)", display: "inline-flex", alignItems: "center", fontSize: 13 }}>{t("cta.preview", "Preview template")}</Link>
                      <Link href="/register" style={{ height: 40, padding: "0 18px", borderRadius: 999, background: "#0E0C0B", color: "#F4EEE4", display: "inline-flex", alignItems: "center", fontSize: 13 }}>{t("cta.use", "Use this design")}</Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {mobile && (
        <div className={s.hideScroll} style={{ display: "flex", gap: 18, overflowX: "auto", scrollSnapType: "x mandatory", padding: "20px 20px 40px" }}>
          {TEMPLATES.slice(0, 8).map((tp) => (
            <Link key={tp.slug} href="/templates" style={{ flex: "none", width: "62vw", scrollSnapAlign: "center", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ width: "100%", aspectRatio: "9/19.5" }}><TemplateShot t={tp} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: SERIF, fontSize: 26 }}>{tp.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", color: "#7A5232" }}>{tp.cat}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <div style={{ height: "clamp(60px,8vw,120px)" }} />
    </section>
  );
}
