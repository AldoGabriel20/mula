"use client";

import { useCallback } from "react";
import { useStore } from "@/lib/kit/store";
import { useGs } from "../context";
import { clamp } from "@/lib/kit/motion/ease";
import { SANS, SERIF } from "../type";
import s from "../gilded-seal.module.css";
import { venueLayout, venueSlide } from "../layout";
import { Photo } from "../parts/Photo";
import { Sprig } from "../parts/Sprig";
import { Chevron, Eyebrow, FRAME_INNER, Heading, ROUND_BTN } from "../parts/ui";
import { arrowKeys, useSwipe } from "../parts/useSwipe";

/**
 * The venue (docs/15 §8.10): moments that share a place share a slide. The photo changes with a
 * clip-path wipe while it settles from a slight zoom; the info card cross-fades over it.
 */
export function Venue() {
  const { refs: r, ctl, d, vw, vh, reduced } = useGs();
  const stored = useStore(ctl.venue);
  const nv = d.venues.length;
  const vi = clamp(stored, 0, Math.max(0, nv - 1));
  const step = useCallback((dir: 1 | -1) => ctl.venue.set((i) => clamp(i + dir, 0, Math.max(0, nv - 1))), [ctl, nv]);
  const go = (i: number) => ctl.venue.set(clamp(i, 0, Math.max(0, nv - 1)));
  const swipe = useSwipe(step, r.vnTrack, reduced);
  const vn = venueLayout(vw, vh);
  const many = nv > 1;

  return (
    <section id="venue" aria-label="The venue" style={{ position: "relative", overflow: "hidden", padding: "clamp(60px,9vh,110px) clamp(16px,5vw,80px) clamp(110px,16vh,180px)", background: "linear-gradient(180deg,#F3EBDF 0%,#EFE6D9 100%)" }}>
      <div data-speed="-0.08" aria-hidden="true" style={{ position: "absolute", right: "clamp(-110px,-6vw,-40px)", top: 30, width: "clamp(170px,22vw,320px)", filter: "blur(3px)", opacity: 0.75, pointerEvents: "none", zIndex: 4 }}>
        <Sprig transform="rotate(200deg)" leaves={5} fillAlpha={0.5} stemWidth={1.6} />
      </div>
      <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
        <Eyebrow>The Venue</Eyebrow>
        <Heading k="venue" />
      </div>
      <div data-reveal="up" data-delay="120" role="region" aria-roledescription="carousel" aria-label="Venues" tabIndex={0} onKeyDown={arrowKeys(step)} style={{ position: "relative", maxWidth: 1280, margin: "clamp(36px,5vw,60px) auto 0", display: "grid", gridTemplateColumns: vn.cols }}>
        <div {...swipe} onPointerCancel={swipe.onPointerUp} onPointerLeave={swipe.onPointerUp} style={{ gridColumn: vn.photoCol, gridRow: 1, position: "relative", height: vn.photoH, overflow: "hidden", borderRadius: 3, background: "#D9CBB8", boxShadow: "0 60px 100px -60px rgba(60,40,25,.6)", touchAction: "pan-y", userSelect: "none" }}>
          <div ref={r.vnTrack} style={{ position: "absolute", inset: 0 }}>
            {d.venues.map((v, i) => {
              const sl = venueSlide(i, vi);
              return (
                <div key={v.name + v.address + i} aria-hidden={sl.hidden} style={{ position: "absolute", inset: 0, clipPath: sl.clip, zIndex: sl.z, transition: "clip-path 1.25s cubic-bezier(.65,0,.35,1)" }}>
                  <div style={{ position: "absolute", inset: 0, transform: `scale(${sl.sc})`, transition: "transform 2s cubic-bezier(.22,1,.36,1)", background: "linear-gradient(160deg,#E2D8C6,#C2B49B)" }}>
                    <Photo photo={v.photo} />
                  </div>
                </div>
              );
            })}
          </div>
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", background: "linear-gradient(180deg,rgba(35,29,24,0) 60%,rgba(35,29,24,.28) 100%)" }} />
          <div aria-hidden="true" style={{ position: "absolute", inset: 14, zIndex: 3, border: "1px solid rgba(252,249,243,.45)", pointerEvents: "none" }} />
        </div>
        <div style={{ gridColumn: vn.infoCol, gridRow: vn.infoRow, alignSelf: "center", position: "relative", zIndex: 5, margin: vn.infoM, padding: "clamp(28px,3.6vw,52px)", background: "var(--k-surface)", border: "1px solid rgba(176,142,82,.42)", boxShadow: "0 50px 90px -40px rgba(60,40,25,.5)" }}>
          <div aria-hidden="true" style={FRAME_INNER(8, 0.2)} />
          <div style={{ position: "relative", display: "grid" }}>
            {d.venues.map((v, i) => {
              const sl = venueSlide(i, vi);
              return (
                <div key={v.name + v.address + i} aria-hidden={sl.hidden} style={{ gridArea: "1 / 1", minWidth: 0, display: "flex", flexDirection: "column", gap: 18, opacity: sl.op, transform: sl.ty, visibility: sl.vis, transition: `opacity .7s ease ${sl.inDelay},transform .9s cubic-bezier(.22,1,.36,1) ${sl.inDelay},visibility 0s linear ${sl.visDelay}` }}>
                  <span style={{ font: `600 10.5px/1.4 ${SANS}`, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--k-x-eyebrow)" }}>{v.label}</span>
                  <h3 style={{ margin: 0, fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(36px,3.8vw,54px)", lineHeight: 1.02, letterSpacing: "-.01em", color: "var(--k-x-ink-strong)", textWrap: "balance" }}>{v.name}</h3>
                  {v.address && <p style={{ margin: 0, maxWidth: "34ch", fontSize: 15, lineHeight: 1.7, color: "var(--k-ink-soft)", userSelect: "text" }}>{v.address}</p>}
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
                    {v.events.map((e, k) => (
                      <li key={k} style={{ display: "flex", flexDirection: "column", gap: 5, padding: "13px 0", borderTop: "1px solid rgba(176,142,82,.3)" }}>
                        <span style={{ fontFamily: SERIF, fontSize: 21, lineHeight: 1.2, color: "var(--k-x-ink-strong)" }}>{e.title}</span>
                        <span style={{ font: `500 11px/1.5 ${SANS}`, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--k-ink-soft)" }}>{e.when}</span>
                      </li>
                    ))}
                  </ul>
                  {v.note && <p style={{ margin: 0, fontFamily: SERIF, fontStyle: "italic", fontSize: 19, lineHeight: 1.5, color: "var(--k-ink-soft)" }}>{v.note}</p>}
                  <a href={v.mapHref} target="_blank" rel="noopener noreferrer" tabIndex={sl.tab} className={s.pill} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 14, minHeight: 50, padding: "0 28px", borderRadius: 999, background: "var(--k-ink)", color: "var(--k-bg)", font: `600 11px/1 ${SANS}`, letterSpacing: ".3em", textTransform: "uppercase", transition: "background .4s ease" }}>
                    Open in Maps
                    <span aria-hidden="true" style={{ width: 18, height: 1, background: "currentColor" }} />
                  </a>
                </div>
              );
            })}
          </div>
          {many && (
            <div style={{ position: "relative", marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(176,142,82,.3)", display: "flex", alignItems: "center", gap: 12 }}>
              <button type="button" onClick={() => step(-1)} aria-label="Previous venue" className={s.ink} style={{ ...ROUND_BTN, width: 44, height: 44, opacity: vi === 0 ? 0.35 : 1 }}>
                <Chevron dir="l" size={15} />
              </button>
              <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 16, overflow: "hidden" }}>
                {d.venues.map((v, i) => (
                  <button key={v.name + v.address + i} type="button" onClick={() => go(i)} aria-pressed={i === vi} style={{ minWidth: 0, minHeight: 44, padding: "0 2px", border: 0, borderBottom: `1px solid ${i === vi ? "var(--k-accent)" : "rgba(176,142,82,0)"}`, background: "transparent", cursor: "pointer", fontFamily: SERIF, fontSize: 18, color: i === vi ? "var(--k-x-ink-strong)" : "var(--k-x-muted-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "color .35s ease,border-color .35s ease" }}>
                    {v.label}
                  </button>
                ))}
              </div>
              <span aria-hidden="true" style={{ flex: "none", font: `600 10px/1 ${SANS}`, letterSpacing: ".24em", color: "var(--k-muted)" }}>{`${vi + 1} / ${nv}`}</span>
              <button type="button" onClick={() => step(1)} aria-label="Next venue" className={s.ink} style={{ ...ROUND_BTN, width: 44, height: 44, opacity: vi >= nv - 1 ? 0.35 : 1 }}>
                <Chevron dir="r" size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
