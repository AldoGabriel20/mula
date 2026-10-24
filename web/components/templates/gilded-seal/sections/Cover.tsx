"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/kit/useTheme";
import { useGs } from "../context";
import { SANS, SCRIPT, SERIF } from "../type";
import { buildCover } from "../gl/cover";
import type { CoverText } from "../gl/coverTextures";
import s from "../gilded-seal.module.css";
import { Sprig } from "../parts/Sprig";

/**
 * Opening cover (docs/15 §8.2–8.3): the three.js envelope fills the screen; this DOM layer adds the
 * couple's names, the Open button, the light shaft, a vignette and two blurred sprigs that drift with
 * the camera. Without WebGL (or when the scene fails) a static card stands in.
 */
export function Cover() {
  const { refs: r, ctl, engine, config, d, coverFallback, opening, open, skip } = useGs();
  const { fonts } = useTheme();

  // the scene reads the latest names / guest when it is built (after fonts and three.js have loaded)
  const text = useRef<CoverText>({ ini1: "", ini2: "", openingTitle: "", p1: "", p2: "", openingSubtitle: "", dateDots: "", guest: "", fonts });
  text.current = { ini1: d.ini1, ini2: d.ini2, openingTitle: config.openingTitle, p1: d.p1, p2: d.p2, openingSubtitle: config.openingSubtitle, dateDots: d.dateDots, guest: d.guest, fonts };

  useEffect(() => {
    ctl.buildCover = (THREE) =>
      buildCover(THREE, {
        canvas: r.coverCanvas.current!,
        root: r.cover.current!,
        text: text.current,
        state: () => {
          const { reduced, fine } = engine.policy();
          return { reduced, fine, pointer: engine.pointer, coverRiseStart: ctl.coverRiseStart, openT0: ctl.openT0, openK: ctl.openK };
        },
      });
    return () => {
      ctl.buildCover = null;
    };
  }, [ctl, engine, r]);

  return (
    <div ref={r.cover} role="dialog" aria-modal="true" aria-label="Wedding invitation cover" style={{ position: "fixed", inset: 0, zIndex: 100, overflow: "hidden", background: "#E9E2D7" }}>
      <canvas ref={r.coverCanvas} aria-hidden="true" onClick={open} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", touchAction: "manipulation" }} />
      {coverFallback && (
        <div aria-hidden="true" style={{ position: "absolute", left: "50%", top: "50%", translate: "-50% -46%", width: "min(460px,80vw)", aspectRatio: "3/2", background: "linear-gradient(180deg,#FBF7EF,#F2E9DA)", boxShadow: "0 30px 60px -20px rgba(70,45,28,.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ position: "absolute", inset: 12, border: "1px solid rgba(199,166,106,.55)" }} />
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 28, color: "#A88748" }}>
            {d.ini1}&amp;{d.ini2}
          </span>
          <span style={{ font: `600 10px/1 ${SANS}`, letterSpacing: ".34em", textTransform: "uppercase", color: "var(--k-x-eyebrow-soft)" }}>Dear {d.guest}</span>
        </div>
      )}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(120% 95% at 50% 46%,rgba(230,219,203,0) 52%,rgba(96,72,52,.28) 100%)" }} />
      <div ref={r.shaft} aria-hidden="true" style={{ position: "absolute", inset: "-20% -30%", pointerEvents: "none", background: "linear-gradient(112deg,rgba(255,250,238,0) 36%,rgba(255,250,238,.26) 46%,rgba(255,250,238,0) 58%)" }} />

      <div data-cover-fg="-1" aria-hidden="true" style={{ position: "absolute", left: "clamp(-150px,-9vw,-60px)", bottom: "clamp(-170px,-14vh,-80px)", width: "clamp(240px,34vw,520px)", filter: "blur(6px)", opacity: 0.85, pointerEvents: "none" }}>
        <Sprig transform="rotate(32deg)" leaves={7} />
      </div>
      <div data-cover-fg="1" aria-hidden="true" style={{ position: "absolute", right: "clamp(-130px,-8vw,-50px)", top: "clamp(-150px,-13vh,-70px)", width: "clamp(200px,28vw,440px)", filter: "blur(5px)", opacity: 0.8, pointerEvents: "none" }}>
        <Sprig transform="rotate(206deg)" leaves={5} berries={[0, 1]} />
      </div>

      <div ref={r.coverHead} style={{ position: "absolute", left: 0, right: 0, top: "max(30px,7vh)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center", padding: "0 20px", pointerEvents: "none" }}>
        <div style={{ font: `600 10.5px/1 ${SANS}`, letterSpacing: ".38em", textTransform: "uppercase", color: "var(--k-x-eyebrow)" }}>The Wedding Of</div>
        <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(38px,6vw,74px)", lineHeight: 1, letterSpacing: "-.01em", color: "var(--k-x-ink-strong)", textShadow: "0 1px 0 rgba(255,250,240,.6)" }}>
          {d.p1}
          <span style={{ fontFamily: SCRIPT, fontSize: ".6em", color: "#9C7B45", padding: "0 .22em" }}>&amp;</span>
          {d.p2}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, font: `500 11px/1 ${SANS}`, letterSpacing: ".3em", textTransform: "uppercase", color: "var(--k-ink-soft)" }}>
          <span style={{ width: 28, height: 1, background: "var(--k-line)" }} />
          {d.displayDate}
          <span style={{ width: 28, height: 1, background: "var(--k-line)" }} />
        </div>
      </div>

      <div ref={r.coverFoot} style={{ position: "absolute", left: 0, right: 0, bottom: "max(28px,6vh)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "0 20px" }}>
        <button type="button" onClick={open} className={s.ink} style={{ minHeight: 50, padding: "0 30px 0 34px", borderRadius: 999, border: "1px solid rgba(48,39,32,.32)", background: "rgba(252,248,241,.72)", backdropFilter: "blur(8px)", font: `600 11.5px/1 ${SANS}`, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--k-ink)", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 14px 30px -18px rgba(60,40,25,.5)", transition: "background .45s ease,color .45s ease,border-color .45s ease" }}>
          Open Invitation
          <span aria-hidden="true" style={{ width: 22, height: 1, background: "currentColor" }} />
        </button>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: "var(--k-ink-soft)" }}>or tap the envelope</div>
      </div>

      {opening && (
        <button type="button" onClick={skip} style={{ position: "absolute", top: "max(14px,env(safe-area-inset-top))", right: 14, minHeight: 44, padding: "0 18px", border: 0, borderRadius: 999, background: "rgba(252,249,243,.75)", font: `600 10.5px/1 ${SANS}`, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--k-ink-soft)", cursor: "pointer", zIndex: 10 }}>
          Skip intro
        </button>
      )}
    </div>
  );
}
