"use client";

import { useEffect } from "react";
import { useGs } from "../context";
import { clamp } from "@/lib/kit/motion/ease";
import { SERIF } from "../type";
import { StackLayer } from "../parts/StackLayer";
import { Eyebrow, VisuallyHidden } from "../parts/ui";

/**
 * Opening statement (docs/15 §8.6): while the hero layer is being covered, the statement's words
 * light up one by one (opacity, a small rise, a blur that clears) and a dotted halo turns behind them.
 */
export function Statement() {
  const { refs: r, ctl, engine, config, d, registerFrame } = useGs();

  useEffect(() => {
    const root = r.statement.current;
    if (!root) return;
    const words = [...root.querySelectorAll<HTMLElement & { _lit?: number }>("[data-word]")];
    return registerFrame("statement", () => {
      if (engine.policy().reduced || !words.length) return; // reduced motion: every word stays lit
      const layers = ctl.stack?.layers ?? [];
      const a = layers[0] ? Math.max(0, layers[0].p) : 1;
      const wp = clamp((a - 0.1) / 0.8) * (words.length + 1);
      words.forEach((el, i) => {
        const lit = Math.round(clamp(wp - i) * 200) / 200;
        if (el._lit === lit) return;
        el._lit = lit;
        el.style.opacity = (0.13 + 0.87 * lit).toFixed(3);
        el.style.transform = lit < 1 ? `translateY(${((1 - lit) * 0.18).toFixed(3)}em)` : "";
        el.style.filter = lit < 1 ? `blur(${((1 - lit) * 3).toFixed(2)}px)` : "";
      });
      const halo = r.halo.current;
      if (halo) halo.style.transform = `rotate(${(a * 24 + (layers[1] ? Math.max(0, layers[1].p) : 0) * 30).toFixed(2)}deg)`;
    });
  }, [r, ctl, engine, registerFrame, config.show.opening]);

  if (!config.show.opening) return null;
  return (
    <StackLayer z={10}>
      <section id="statement" ref={r.statement} data-vis="statement" aria-label="Opening statement" style={{ position: "relative", height: "100svh", minHeight: 560, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "clamp(26px,4vw,44px)", padding: "0 clamp(20px,6vw,96px)", textAlign: "center", background: "radial-gradient(70% 60% at 50% 50%,#FFFDF9 0%,#F6EFE4 100%)", borderRadius: "28px 28px 0 0", boxShadow: "0 -40px 60px -20px rgba(30,22,16,.28)" }}>
        <svg ref={r.halo} aria-hidden="true" viewBox="0 0 600 600" style={{ position: "absolute", left: "50%", top: "50%", width: "min(96vw,98svh)", height: "min(96vw,98svh)", translate: "-50% -50%", pointerEvents: "none", overflow: "visible" }}>
          <circle cx="300" cy="300" r="292" fill="none" stroke="rgba(176,142,82,.4)" strokeWidth=".8" strokeDasharray="1 7" />
          <circle cx="300" cy="300" r="252" fill="none" stroke="rgba(176,142,82,.2)" strokeWidth=".6" />
          <path d="M300 0V18M300 582V600M0 300H18M582 300H600" stroke="rgba(176,142,82,.55)" strokeWidth=".8" />
        </svg>
        <Eyebrow style={{ position: "relative" }}>{config.openingTitle}</Eyebrow>
        <svg aria-hidden="true" width="180" height="16" viewBox="0 0 180 16" fill="none" style={{ position: "relative", display: "block", overflow: "visible" }}>
          <path data-reveal="draw" d="M0 8H72" stroke="var(--k-line)" strokeWidth="1" />
          <path data-reveal="draw" data-delay="200" d="M90 2L96 8L90 14L84 8Z" stroke="var(--k-line)" strokeWidth="1" />
          <path data-reveal="draw" d="M180 8H108" stroke="var(--k-line)" strokeWidth="1" />
        </svg>
        <p style={{ position: "relative", margin: 0, maxWidth: "15ch", fontFamily: SERIF, fontWeight: 300, fontStyle: "italic", fontSize: "clamp(42px,6.6vw,100px)", lineHeight: 1.06, letterSpacing: "-.01em", color: "var(--k-x-ink-strong)", textWrap: "balance" }}>
          <VisuallyHidden>{config.statement}</VisuallyHidden>
          {d.statementWords.map((w, i) => (
            <span key={i} data-word="" aria-hidden="true" style={{ display: "inline-block", padding: "0 .12em" }}>
              {w}
            </span>
          ))}
        </p>
        <p data-reveal="up" data-delay="500" style={{ position: "relative", margin: 0, maxWidth: "34ch", fontFamily: SERIF, fontSize: "clamp(20px,1.8vw,25px)", lineHeight: 1.5, color: "var(--k-ink-soft)" }}>
          {config.openingSubtitle}
        </p>
      </section>
    </StackLayer>
  );
}

