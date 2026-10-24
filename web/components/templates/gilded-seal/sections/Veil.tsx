"use client";

import { SANS, SERIF } from "../type";
import { useGs } from "../context";

/**
 * Loading veil (docs/15 §8.1): the couple's monogram fills with gold bottom-up while fonts and the
 * 3D scene load, then the veil wipes away. The root drives `veilFill` / `veilBar` every frame.
 */
export function Veil() {
  const { refs: r, d } = useGs();
  const mono = (
    <>
      {d.ini1}
      <span style={{ fontSize: ".6em", padding: "0 .06em" }}>&amp;</span>
      {d.ini2}
    </>
  );
  return (
    <div ref={r.veil} role="status" aria-label="Preparing your invitation" style={{ position: "fixed", inset: 0, zIndex: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, background: "radial-gradient(70% 60% at 50% 42%,#FBF6EE 0%,#EDE3D4 100%)" }}>
      <div ref={r.veilMark} aria-hidden="true" style={{ position: "relative", fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(84px,14vw,136px)", lineHeight: 1.05, padding: "0 .1em" }}>
        <span style={{ display: "block", color: "transparent", WebkitTextStroke: "1px rgba(168,135,72,.6)" }}>{mono}</span>
        <span ref={r.veilFill} style={{ position: "absolute", inset: 0, padding: "0 .1em", display: "block", clipPath: "inset(100% 0 0 0)", background: "linear-gradient(170deg,#EBDDB6 0%,var(--k-line) 52%,#8A6C3E 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          {mono}
        </span>
      </div>
      <div style={{ font: `600 10px/1 ${SANS}`, letterSpacing: ".42em", textTransform: "uppercase", color: "var(--k-x-eyebrow-soft)" }}>Preparing your invitation</div>
      <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "rgba(199,166,106,.18)" }}>
        <div ref={r.veilBar} style={{ height: "100%", background: "var(--k-line)", transform: "scaleX(0)", transformOrigin: "0 50%" }} />
      </div>
    </div>
  );
}
