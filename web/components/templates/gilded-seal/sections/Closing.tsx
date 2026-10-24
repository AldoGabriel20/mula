"use client";

import { useEffect } from "react";
import { useGs } from "../context";
import { splitChars } from "../derive";
import { clamp, ease } from "@/lib/kit/motion/ease";
import { SANS, SCRIPT, SERIF } from "../type";
import { FRAG_CONTOUR } from "../gl/shaders";
import { makeLayer, type GlLayer } from "@/lib/kit/gl/layer";
import { useTheme } from "@/lib/kit/useTheme";
import { LAYER_DPR, themedLayers } from "../gl/layers";
import { Photo } from "../parts/Photo";
import { Sprig } from "../parts/Sprig";
import { WaxSeal } from "../parts/WaxSeal";
import { VisuallyHidden } from "../parts/ui";

/**
 * Closing (docs/15 §8.12): a last portrait in an arch that tilts up into place as the section arrives,
 * the thank-you line, the couple's names appearing letter by letter, and the footer. A contour shader
 * runs behind it, like the hero's.
 */
export function Closing() {
  const { refs: r, engine, config, d, registerFrame, onGl } = useGs();
  const { colors } = useTheme();
  const chars1 = splitChars(d.p1);
  const chars2 = splitChars(d.p2, 380);
  const show = config.show.closing;

  useEffect(() => {
    const sec = r.closing.current;
    if (!sec) return;
    let bgL: GlLayer | null = null;
    let bgT = 0;
    const offGl = onGl((low) => {
      if (low) {
        if (r.closingBg.current) r.closingBg.current.style.display = "none";
        return;
      }
      bgL = makeLayer(r.closingBg.current, FRAG_CONTOUR, themedLayers(colors).closing, LAYER_DPR.closing);
    });
    const unframe = registerFrame("closing", (time, _dt, _vw, vh) => {
      const rect = sec.getBoundingClientRect();
      const rp = ease.outCubic(clamp((vh - rect.top) / (vh * 0.95)));
      const arch = r.closingArch.current;
      if (arch && !engine.policy().reduced) arch.style.transform = `perspective(1200px) translateY(${((1 - rp) * 150).toFixed(1)}px) rotateX(${((1 - rp) * 18).toFixed(2)}deg) scale(${(0.92 + 0.08 * rp).toFixed(4)})`;
      if (bgL && !engine.policy().reduced && time - bgT > 40) {
        bgT = time;
        bgL.render({ uTime: time / 1000, uPointer: [engine.pointer.x, -engine.pointer.y] });
      }
    });
    return () => {
      unframe();
      offGl();
      bgL?.destroy();
    };
  }, [r, engine, registerFrame, onGl, show, colors]);

  if (!show) return null;
  return (
    <section ref={r.closing} data-vis="closing" aria-label="Closing" style={{ position: "relative", overflow: "hidden", padding: "clamp(110px,17vh,200px) clamp(20px,6vw,96px) 40px", background: "#F3EADF", textAlign: "center" }}>
      <canvas ref={r.closingBg} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none" }} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(55% 40% at 50% 30%,rgba(220,192,185,.45) 0%,rgba(220,192,185,0) 70%)" }} />
      <div data-speed="0.06" aria-hidden="true" style={{ position: "absolute", left: "clamp(-90px,-5vw,-30px)", top: 60, width: "clamp(150px,20vw,290px)", filter: "blur(1.5px)", opacity: 0.85, pointerEvents: "none" }}>
        <Sprig muted transform="rotate(14deg)" leaves={7} fillAlpha={0.32} stemWidth={1.2} leafStrokeWidth={0.9} berries={[0, 1]} />
      </div>
      <div data-speed="-0.06" aria-hidden="true" style={{ position: "absolute", right: "clamp(-90px,-5vw,-30px)", bottom: 140, width: "clamp(140px,18vw,260px)", filter: "blur(1.5px)", opacity: 0.85, pointerEvents: "none" }}>
        <Sprig muted transform="rotate(-160deg) scaleX(-1)" leaves={5} fillAlpha={0.32} stemWidth={1.2} leafStrokeWidth={0.9} berries={[0, 2]} />
      </div>

      <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(26px,3.6vw,40px)" }}>
        <div ref={r.closingArch} style={{ position: "relative", width: "min(330px,68vw)", aspectRatio: "3/4", transformStyle: "preserve-3d" }}>
          <div aria-hidden="true" data-speed="0.03" style={{ position: "absolute", top: -16, left: -16, right: 16, bottom: 16, border: "1px solid rgba(176,142,82,.75)", borderRadius: "999px 999px 3px 3px" }} />
          <div data-reveal="mask" style={{ position: "absolute", inset: 0, borderRadius: "999px 999px 3px 3px", overflow: "hidden", background: "linear-gradient(165deg,#EADBD1,#C6AF9F)", boxShadow: "0 50px 90px -50px rgba(60,40,25,.55)" }}>
            <div data-reveal-inner="" style={{ position: "absolute", inset: 0 }}>
              <Photo photo={config.photos.closing} />
            </div>
          </div>
          <WaxSeal ini1={d.ini1} ini2={d.ini2} size={78} font={22} style={{ position: "absolute", left: "50%", bottom: 0, translate: "-50% 50%" }} />
        </div>
        <p data-reveal="up" style={{ margin: "30px 0 0", maxWidth: "24ch", fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(28px,3.4vw,44px)", lineHeight: 1.3, color: "var(--k-ink-soft)", textWrap: "balance" }}>{config.closingMessage}</p>
        <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(52px,7.4vw,108px)", lineHeight: 1.05, letterSpacing: "-.02em", color: "var(--k-x-ink-strong)", display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline" }}>
          <VisuallyHidden>{d.couple}</VisuallyHidden>
          <span aria-hidden="true" style={{ whiteSpace: "nowrap" }}>
            {chars1.map((ch, i) => (
              <span key={i} data-reveal="char" data-delay={ch.d} style={{ display: "inline-block" }}>
                {ch.c}
              </span>
            ))}
          </span>
          <span aria-hidden="true" data-reveal="char" data-delay="320" style={{ display: "inline-block", fontFamily: SCRIPT, fontSize: ".58em", color: "#9C7B45", padding: "0 .22em" }}>
            &amp;
          </span>
          <span aria-hidden="true" style={{ whiteSpace: "nowrap" }}>
            {chars2.map((ch, i) => (
              <span key={i} data-reveal="char" data-delay={ch.d} style={{ display: "inline-block" }}>
                {ch.c}
              </span>
            ))}
          </span>
        </div>
        {d.dateDots && (
          <div data-reveal="fade" data-delay="600" style={{ display: "flex", alignItems: "center", gap: 14, font: `500 11.5px/1 ${SANS}`, letterSpacing: ".32em", textTransform: "uppercase", color: "#3E332B" }}>
            <span style={{ width: 28, height: 1, background: "var(--k-line)" }} />
            {d.dateDots}
            <span style={{ width: 28, height: 1, background: "var(--k-line)" }} />
          </div>
        )}
      </div>
      <footer style={{ position: "relative", marginTop: "clamp(90px,14vh,150px)", paddingTop: 28, borderTop: "1px solid rgba(176,142,82,.3)", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 28px", font: `600 9.5px/1.4 ${SANS}`, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--k-x-muted-strong)" }}>
        <span>With love, {d.couple}</span>
        <span>A Mula invitation</span>
      </footer>
    </section>
  );
}
