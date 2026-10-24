"use client";

import { useEffect } from "react";
import { useCountdown } from "@/lib/kit/behaviors/useCountdown";
import { useGs } from "../context";
import { clamp, ease, hash } from "@/lib/kit/motion/ease";
import { SANS, SERIF } from "../type";
import { FRAG_CONTOUR } from "../gl/shaders";
import { makeLayer, type GlLayer } from "@/lib/kit/gl/layer";
import { useTheme } from "@/lib/kit/useTheme";
import { LAYER_DPR, themedLayers } from "../gl/layers";
import { TICKS } from "../layout";
import { Eyebrow } from "../parts/ui";

const CIRC = 1734.16; // circumference of the r = 276 ring
const NUM = { fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(44px,7vw,88px)", lineHeight: 1, fontVariantNumeric: "lining-nums tabular-nums", color: "#F4ECDF" } as const;
const UNIT = { font: `600 10px/1 ${SANS}`, letterSpacing: ".3em", textTransform: "uppercase", color: "#CDBFA9" } as const;

/** Chequered diamond dissolve along a section edge (prototype `drawSeam`). `p` 0 = solid, 1 = gone. */
function drawSeam(cv: HTMLCanvasElement | null, p: number, color: string, fromTop: boolean) {
  if (!cv) return;
  const w = cv.clientWidth;
  const h = cv.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  const x = cv.getContext("2d");
  if (!x) return;
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, w, h);
  if (p >= 1) return;
  x.fillStyle = color;
  const sz = w < 640 ? 16 : 22;
  const rows = Math.ceil(h / sz) + 1;
  const cols = Math.ceil(w / sz) + 2;
  const th = 1 - p * 1.4;
  x.beginPath();
  for (let r = 0; r < rows; r++) {
    const base = r / rows;
    const cy = fromTop ? r * sz : h - r * sz;
    for (let c = 0; c < cols; c++) {
      const k = clamp((th - (base * 1.05 + hash(r * 73 + c * 151) * 0.3 - 0.08)) / 0.14);
      if (k <= 0) continue;
      const cx = c * sz + ((r % 2) * sz) / 2 - sz / 2;
      const hf = sz * 0.78 * k;
      x.moveTo(cx, cy - hf);
      x.lineTo(cx + hf, cy);
      x.lineTo(cx, cy + hf);
      x.lineTo(cx - hf, cy);
      x.closePath();
    }
  }
  x.fill();
}

/**
 * Save the date (docs/15 §8.8): a dark section whose top and bottom edges dissolve into the sections
 * around it, a gilded ring that runs one lap when it comes into view and then follows the seconds,
 * and the countdown. The ring, ticks and seams are written straight to the DOM every frame.
 */
export function DateRing() {
  const { refs: r, engine, config, d, registerFrame, onGl } = useGs();
  const { colors } = useTheme();

  const cd = useCountdown(config.weddingDate);

  useEffect(() => {
    const sec = r.date.current;
    if (!sec) return;
    let bgL: GlLayer | null = null;
    let bgT = 0;
    let seamT = -1;
    let seamB = -1;
    let lapStart: number | null = null;
    let tickEls: { el: SVGLineElement; a: number; major: boolean; lit: number; o: number }[] | null = null;

    const offGl = onGl((low) => {
      if (low) {
        if (r.dateBg.current) r.dateBg.current.style.display = "none";
        return;
      }
      bgL = makeLayer(r.dateBg.current, FRAG_CONTOUR, themedLayers(colors).date, LAYER_DPR.date);
    });

    const ringFrame = (time: number, vh: number) => {
      const arc = r.ringArc.current;
      const glow = r.ringGlow.current;
      const head = r.ringHead.current;
      const ringEl = r.ring.current;
      if (!arc || !glow || !head || !ringEl) return;
      if (lapStart == null) {
        const rr = ringEl.getBoundingClientRect();
        if (rr.top < vh * 0.75 && rr.bottom > 0) lapStart = time;
        else return;
      }
      if (!tickEls) tickEls = [...sec.querySelectorAll<SVGLineElement>("[data-tick]")].map((el, i) => ({ el, a: i / 60, major: i % 5 === 0, lit: -1, o: -1 }));
      const t = engine.policy().reduced ? 1 : clamp((time - lapStart) / 5200);
      let ang: number;
      let arcP: number;
      let gl: number;
      if (t < 1) {
        const e = ease.inOutSine(t);
        ang = arcP = clamp(e - 0.028 * Math.sin(e * Math.PI * 8));
        gl = 160 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 20;
        head.setAttribute("opacity", Math.min(1, t * 6).toFixed(2));
      } else {
        ang = (Date.now() % 60000) / 60000;
        arcP = 1;
        gl = 70;
        head.setAttribute("opacity", "1");
      }
      arc.setAttribute("stroke-dashoffset", (CIRC * (1 - arcP)).toFixed(2));
      const len = ang * CIRC;
      glow.setAttribute("stroke-dasharray", `${gl.toFixed(1)} ${CIRC}`);
      glow.setAttribute("stroke-dashoffset", (gl - len).toFixed(2));
      const th = ang * Math.PI * 2;
      head.setAttribute("transform", `translate(${(300 + 276 * Math.sin(th)).toFixed(2)} ${(300 - 276 * Math.cos(th)).toFixed(2)})`);
      for (const k of tickEls) {
        const base = k.major ? 0.55 : 0.3;
        let o: number;
        if (t < 1) {
          if (k.lit < 0 && ang >= k.a) k.lit = time;
          o = k.lit < 0 ? 0.14 : base + (1 - base) * Math.exp(-(time - k.lit) / 800);
        } else {
          let dd = Math.abs(ang - k.a);
          dd = Math.min(dd, 1 - dd);
          o = base + 0.65 * Math.exp(-(dd * dd) / 0.0005);
        }
        if (Math.abs(o - k.o) > 0.01) {
          k.o = o;
          k.el.setAttribute("opacity", o.toFixed(2));
        }
      }
    };

    const unframe = registerFrame("date", (time, _dt, _vw, vh) => {
      const rect = sec.getBoundingClientRect();
      const pTop = clamp(1 - (rect.top + vh * 0.12) / vh);
      if (Math.abs(pTop - seamT) > 0.003) {
        seamT = pTop;
        drawSeam(r.seamTop.current, pTop, colors.surface, true);
      }
      const pBot = clamp((rect.bottom - vh * 0.3) / (vh * 0.7));
      if (Math.abs(pBot - seamB) > 0.003) {
        seamB = pBot;
        drawSeam(r.seamBottom.current, pBot, colors.bg, false);
      }
      if (bgL && !engine.policy().reduced && time - bgT > 40) {
        bgT = time;
        bgL.render({ uTime: time / 1000, uPointer: [engine.pointer.x, -engine.pointer.y] });
      }
      ringFrame(time, vh);
    });
    return () => {
      unframe();
      offGl();
      bgL?.destroy();
    };
  }, [r, engine, registerFrame, onGl, colors]);

  return (
    <div style={{ position: "relative", zIndex: 30 }}>
      <section id="date" ref={r.date} data-vis="date" aria-label="Save the date" style={{ position: "relative", overflow: "hidden", borderRadius: "28px 28px 0 0", boxShadow: "0 -40px 60px -20px rgba(30,22,16,.3)", padding: "clamp(130px,20vh,220px) clamp(20px,6vw,96px) clamp(150px,22vh,240px)", background: "radial-gradient(70% 55% at 50% 30%,#3A2F27 0%,#2A221C 60%,#211A15 100%)", color: "#F4ECDF", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(34px,4.6vw,52px)" }}>
        <canvas ref={r.dateBg} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none" }} />
        <canvas ref={r.seamTop} aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "30svh", pointerEvents: "none", zIndex: 2 }} />
        <canvas ref={r.seamBottom} aria-hidden="true" style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "24svh", pointerEvents: "none", zIndex: 2 }} />
        <Eyebrow color="#D9C08E" style={{ position: "relative", zIndex: 3 }}>
          Save the Date
        </Eyebrow>
        <div ref={r.ring} style={{ position: "relative", zIndex: 3, width: "min(86vw,64svh,600px)", aspectRatio: "1/1", containerType: "inline-size" }}>
          <svg aria-hidden="true" viewBox="0 0 600 600" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
            <defs>
              <filter id="gsRingGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>
            <circle cx="300" cy="300" r="276" fill="none" stroke="rgba(232,215,173,.14)" strokeWidth="1" />
            <circle cx="300" cy="300" r="240" fill="none" stroke="rgba(232,215,173,.08)" strokeWidth="1" strokeDasharray="2 6" />
            <g>
              {TICKS.map((t, i) => (
                <line key={i} data-tick="" x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--k-accent-soft)" strokeWidth={t.w} opacity=".22" />
              ))}
            </g>
            <circle ref={r.ringGlow} cx="300" cy="300" r="276" fill="none" stroke="#EBCB8B" strokeWidth="6" opacity=".7" filter="url(#gsRingGlow)" transform="rotate(-90 300 300)" strokeDasharray={`0 ${CIRC}`} />
            <circle ref={r.ringArc} cx="300" cy="300" r="276" fill="none" stroke="#C7A66A" strokeWidth="1.6" transform="rotate(-90 300 300)" strokeDasharray={`${CIRC} ${CIRC}`} strokeDashoffset={CIRC} />
            <g ref={r.ringHead} opacity="0" transform="translate(300 24)">
              <circle r="13" fill="#EBCB8B" filter="url(#gsRingGlow)" />
              <circle r="3.4" fill="#FFF8E8" />
            </g>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.4cqw" }}>
            <div data-reveal="fade" data-delay="200" style={{ font: `600 max(10px,2cqw)/1 ${SANS}`, letterSpacing: ".36em", textTransform: "uppercase", color: "#CDBFA9" }}>
              {d.weekday}
            </div>
            <div data-reveal="up" data-delay="120" style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "max(22px,6.4cqw)", lineHeight: 1, color: "var(--k-accent-soft)" }}>
              {d.monthName}
            </div>
            <div data-reveal="up" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "36cqw", lineHeight: 0.82, letterSpacing: "-.03em", fontVariantNumeric: "lining-nums", background: "linear-gradient(170deg,#F4E7C8 0%,#C7A66A 45%,var(--k-accent-soft) 70%,#A88748 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", padding: "0 .04em .06em" }}>
              {d.day}
            </div>
            <div data-reveal="up" data-delay="200" style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "max(22px,6.4cqw)", lineHeight: 1, color: "var(--k-accent-soft)" }}>
              {d.year}
            </div>
          </div>
        </div>
        {cd.running && (
          <div data-reveal="up" data-delay="200" role="timer" aria-label="Time remaining until the wedding" style={{ position: "relative", zIndex: 3, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", width: "100%", maxWidth: 780 }}>
            {(
              [
                ["Days", cd.d],
                ["Hours", cd.h],
                ["Minutes", cd.m],
                ["Seconds", cd.s],
              ] as const
            ).map(([label, v], i) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "0 4px", borderLeft: i ? "1px solid rgba(232,215,173,.2)" : undefined }}>
                <span style={NUM}>{v}</span>
                <span style={UNIT}>{label}</span>
              </div>
            ))}
          </div>
        )}
        {cd.ended && (
          <p style={{ position: "relative", zIndex: 3, margin: 0, maxWidth: "30ch", fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(24px,2.6vw,34px)", lineHeight: 1.4, color: "#F4ECDF" }}>{cd.endedText}</p>
        )}
      </section>
    </div>
  );
}
