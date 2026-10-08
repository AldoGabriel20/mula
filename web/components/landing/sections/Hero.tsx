"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Magnetic } from "@/lib/motion";
import { InviteScreen } from "../InviteScreen";
import { BY_SLUG } from "../data";
import { SERIF } from "../fonts";
import { useLang } from "../i18n";
import { useScrollTick } from "../hooks";
import { useInvitation } from "../useInvitation";
import s from "../landing.module.css";

const TITLE = "Every beginning deserves its own story.";
const halfW = (w: number, h: number) => 2.545 * (w / h);

export function Hero() {
  const { t, tr } = useLang();
  const canvas = useRef<HTMLCanvasElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const [heroIn, setHeroIn] = useState(0);

  const { handle, failed } = useInvitation(canvas, () => ({
    mode: "hero",
    layout: (w, h) => (w < 900 ? { x: 0, y: 0.95, s: Math.min(0.72, (halfW(w, h) * 1.7) / 3.7), rot: -0.12 } : { x: Math.min(halfW(w, h) * 0.42, 2.3), y: 0.12, s: 1, rot: -0.34 }),
    onPhase: (n) => {
      if (n === "material") setHeroIn((v) => Math.max(v, 1));
      if (n === "ready") setTimeout(() => setHeroIn(2), 300);
    },
  }));

  useEffect(() => {
    const a = setTimeout(() => setHeroIn((v) => Math.max(v, 1)), 2600);
    const b = setTimeout(() => setHeroIn(2), 5200); // fallback if the scene never reports "ready"
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  useEffect(() => { if (failed) setHeroIn(2); }, [failed]);

  useScrollTick(() => {
    const y = scrollY, vh = innerHeight;
    handle.current?.setScroll(y / vh);
    const el = text.current;
    if (el) {
      el.style.transform = `translate3d(0,${(y * 0.32).toFixed(1)}px,0)`;
      el.style.opacity = String(Math.max(0, 1 - (y / vh) * 1.5));
    }
  });

  const words = t("hero.title", TITLE).split(" ");
  const A = heroIn >= 1, B = heroIn >= 2;
  const base = BY_SLUG.serenity.d;

  return (
    <section data-bg="#0E0C0B" data-screen-label="01 Hero" style={{ position: "relative", height: "100svh", minHeight: 640, background: "#0E0C0B", overflow: "hidden" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(55% 60% at 70% 46%, rgba(201,165,110,.17), rgba(14,12,11,0) 70%), radial-gradient(45% 45% at 12% 88%, rgba(74,29,36,.45), rgba(14,12,11,0) 70%)" }} />
      <div style={{ position: "absolute", inset: 0 }}>
        <canvas ref={canvas} role="img" aria-label="A folded ivory wedding invitation with gold foil names, Raka and Celine, floating and slowly turning" style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
      {failed && (
        <div style={{ position: "absolute", right: "6%", top: "16%", width: "min(250px,30vw)", aspectRatio: "9/19.5", transform: "rotate(4deg)" }}>
          <InviteScreen d={{ ...base, guest: "Anindya & Family" }} />
        </div>
      )}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.6) 100%)" }} />
      <div ref={text} style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 3, pointerEvents: "none" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px,3.6vw,52px) clamp(40px,9vh,96px)", display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, fontWeight: 600, letterSpacing: ".3em", textTransform: "uppercase", color: "#C9A56E", opacity: A ? 1 : 0, transition: "opacity 1s ease" }}>
            <span>Mula</span>
            <span style={{ width: 36, height: 1, background: "rgba(201,165,110,.6)" }} />
            <span>{t("hero.label", "Digital invitations")}</span>
          </div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(50px,6.4vw,108px)", lineHeight: 0.94, letterSpacing: "-.028em", margin: 0, maxWidth: "7.6em", textWrap: "balance" }}>
            {words.map((w, i) => (
              <span key={i} style={{ display: "inline-block", marginRight: ".2em", fontStyle: i >= words.length - 3 ? "italic" : "normal", opacity: A ? 1 : 0, filter: `blur(${A ? 0 : 16}px)`, transform: `translateY(${A ? 0 : 34}px)`, transition: `opacity 1.2s ease ${i * 110}ms, filter 1.4s ease ${i * 110}ms, transform 1.6s cubic-bezier(.2,.75,.15,1) ${i * 110}ms` }}>
                {w}
              </span>
            ))}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 28, opacity: B ? 1 : 0, transform: `translateY(${B ? 0 : 22}px)`, transition: "opacity 1.1s ease, transform 1.3s cubic-bezier(.2,.75,.15,1)", pointerEvents: B ? "auto" : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <p style={{ margin: 0, maxWidth: 430, fontSize: "clamp(15px,1.2vw,18px)", lineHeight: 1.6, color: "#C8BEB2", textWrap: "pretty" }}>{t("hero.sub", "Digital invitations designed to make every celebration feel unforgettable.")}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Magnetic>
                  <Link href="/register" data-cursor="Create" className={s.btnLight}>
                    <span>{t("cta.create", "Create your invitation")}</span>
                    <span data-arrow="1">→</span>
                  </Link>
                </Magnetic>
                <Link href="/templates" className={s.btnGhost}>
                  <span>{t("cta.explore", "Explore designs")}</span>
                </Link>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: "#9C9186" }}>
              <span>{tr("Shown · Serenity template")}</span>
              <span style={{ width: 1, height: 44, background: "linear-gradient(to bottom, rgba(201,165,110,0), #C9A56E)" }} />
              <span>{tr("Scroll")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
