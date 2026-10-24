"use client";

import { useCallback, useState } from "react";
import { useGs } from "../context";
import { clamp } from "@/lib/kit/motion/ease";
import { SANS, SERIF } from "../type";
import s from "../gilded-seal.module.css";
import { eventLayout, eventSlide } from "../layout";
import { Photo } from "../parts/Photo";
import { FRAME_INNER, Chevron, Eyebrow, Heading, ROUND_BTN } from "../parts/ui";
import { arrowKeys, useSwipe } from "../parts/useSwipe";

/**
 * The celebration (docs/15 §8.9): one card per moment in a 3D coverflow (a plain slide on phones).
 * Swipe, arrow keys, the arrows and the title tabs move between them; a neighbour click selects it.
 * "See the venue" selects that moment's venue in The Venue below.
 */
export function Celebration() {
  const { refs: r, ctl, config, d, vw, reduced } = useGs();
  const [active, setActive] = useState(0);
  const n = d.events.length;
  const ei = clamp(active, 0, Math.max(0, n - 1));
  const go = useCallback((i: number) => setActive(clamp(i, 0, Math.max(0, n - 1))), [n]);
  const step = useCallback((dir: 1 | -1) => setActive((a) => clamp(a + dir, 0, Math.max(0, n - 1))), [n]);
  const swipe = useSwipe(step, r.evTrack, reduced);
  const ev = eventLayout(vw);
  const many = n > 1;
  const live = config.live && /^https:\/\//i.test(config.live.stream_url) ? config.live : null;

  return (
    <section id="details" aria-label="The celebration" style={{ position: "relative", overflow: "hidden", padding: "clamp(100px,15vh,170px) 0 clamp(80px,12vh,130px)", background: "radial-gradient(60% 50% at 50% 58%,#FCF8F1 0%,#F3EBDF 100%)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, textAlign: "center", padding: "0 20px" }}>
        <Eyebrow>The Celebration</Eyebrow>
        <Heading k="celebration" override={config.titles.celebration} />
      </div>
      <div data-reveal="fade" data-delay="150" role="region" aria-roledescription="carousel" aria-label="Wedding schedule" tabIndex={0} onKeyDown={arrowKeys(step)} style={{ position: "relative", marginTop: "clamp(44px,6vw,72px)" }}>
        <div {...swipe} onPointerCancel={swipe.onPointerUp} onPointerLeave={swipe.onPointerUp} style={{ position: "relative", height: ev.h, perspective: 1700, perspectiveOrigin: "50% 42%", touchAction: "pan-y", userSelect: "none" }}>
          <div ref={r.evTrack} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
            {d.events.map((e, i) => {
              const sl = eventSlide(i, ei, vw, reduced);
              return (
                <article key={e.n} aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${e.title}`} aria-hidden={sl.hidden} style={{ position: "absolute", left: "50%", top: 0, width: ev.w, height: ev.h, marginLeft: ev.ml, transform: sl.tf, opacity: sl.op, zIndex: sl.z, visibility: sl.vis, transition: `transform 1s cubic-bezier(.22,1,.36,1),opacity .8s ease,visibility 0s linear ${sl.visDelay}`, display: "grid", gridTemplateColumns: ev.cols, gridTemplateRows: ev.rows, background: "var(--k-surface)", border: "1px solid rgba(176,142,82,.45)", boxShadow: "0 50px 90px -50px rgba(60,40,25,.55)", overflow: "hidden" }}>
                  <div aria-hidden="true" style={FRAME_INNER(8)} />
                  <div style={{ position: "relative", margin: ev.imgM, overflow: "hidden", borderRadius: ev.imgR, background: "linear-gradient(165deg,#EADBD1 0%,#D6C0B3 55%,#C6AF9F 100%)" }}>
                    <Photo photo={e.photo} />
                    <span aria-hidden="true" style={{ position: "absolute", left: 18, bottom: 10, fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 84, lineHeight: 1, color: "rgba(252,249,243,.9)", textShadow: "0 2px 18px rgba(60,40,25,.25)", pointerEvents: "none" }}>{e.numeral}</span>
                  </div>
                  <div style={{ position: "relative", minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, padding: ev.pad }}>
                    {e.label && <span style={{ font: `600 10.5px/1 ${SANS}`, letterSpacing: ".34em", textTransform: "uppercase", color: "var(--k-x-eyebrow)" }}>{e.label}</span>}
                    <h3 style={{ margin: 0, fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(38px,4.2vw,58px)", lineHeight: 1, letterSpacing: "-.01em", color: "var(--k-x-ink-strong)", textWrap: "balance" }}>{e.title}</h3>
                    <span aria-hidden="true" style={{ width: 44, height: 1, background: "var(--k-line)", margin: "4px 0" }} />
                    <span style={{ font: `500 12px/1.5 ${SANS}`, letterSpacing: ".2em", textTransform: "uppercase", color: "#3E332B" }}>{e.dateLong}</span>
                    {e.timeRange && <span style={{ fontFamily: SERIF, fontSize: "clamp(30px,3vw,38px)", lineHeight: 1, color: "var(--k-x-ink-strong)" }}>{e.timeRange}</span>}
                    {e.description && (
                      <p style={{ margin: "2px 0 0", maxWidth: "36ch", fontFamily: SERIF, fontStyle: "italic", fontSize: 20, lineHeight: 1.45, color: "var(--k-ink-soft)", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" }}>{e.description}</p>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 18px", marginTop: 6, paddingTop: 16, borderTop: "1px solid rgba(176,142,82,.3)" }}>
                      <span style={{ minWidth: 0, fontSize: 14, lineHeight: 1.5, color: "var(--k-ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{e.venue}</span>
                      <a href="#venue" className={s.link} onClick={() => ctl.venue.set(e.vIdx)} tabIndex={sl.tab} style={{ display: "inline-flex", alignItems: "center", gap: 10, minHeight: 44, font: `600 10.5px/1 ${SANS}`, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--k-ink)" }}>
                        See the venue
                        <span aria-hidden="true" style={{ width: 16, height: 1, background: "currentColor" }} />
                      </a>
                    </div>
                  </div>
                  {sl.inactive && <button type="button" onClick={() => go(i)} tabIndex={-1} aria-label={`Show ${e.title}`} style={{ position: "absolute", inset: 0, zIndex: 5, border: 0, background: "transparent", cursor: "pointer" }} />}
                </article>
              );
            })}
          </div>
        </div>
        {many && (
          <div style={{ width: ev.w, maxWidth: "calc(100% - 36px)", margin: "clamp(28px,4vw,40px) auto 0", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button type="button" onClick={() => step(-1)} aria-label="Previous event" className={s.ink} style={{ ...ROUND_BTN, width: 48, height: 48, opacity: ei === 0 ? 0.35 : 1 }}>
                <Chevron dir="l" />
              </button>
              <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center", gap: "clamp(8px,2vw,28px)", overflow: "hidden" }}>
                {d.events.map((e, i) => (
                  <button key={e.n} type="button" onClick={() => go(i)} aria-pressed={i === ei} style={{ minWidth: 0, minHeight: 48, padding: "6px 4px", border: 0, borderBottom: `1px solid ${i === ei ? "var(--k-accent)" : "rgba(176,142,82,0)"}`, background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, color: i === ei ? "var(--k-x-ink-strong)" : "var(--k-x-muted-strong)", transition: "color .35s ease,border-color .35s ease" }}>
                    <span style={{ fontFamily: SERIF, fontSize: 19, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{e.title}</span>
                    {e.timeLabel && <span style={{ font: `600 9.5px/1 ${SANS}`, letterSpacing: ".24em", textTransform: "uppercase" }}>{e.timeLabel}</span>}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => step(1)} aria-label="Next event" className={s.ink} style={{ ...ROUND_BTN, width: 48, height: 48, opacity: ei >= n - 1 ? 0.35 : 1 }}>
                <Chevron dir="r" />
              </button>
            </div>
            <div aria-hidden="true" style={{ position: "relative", height: 1, background: "rgba(176,142,82,.25)" }}>
              <div style={{ position: "absolute", inset: 0, background: "var(--k-accent)", transformOrigin: "0 50%", transform: `scaleX(${(ei + 1) / n})`, transition: "transform .9s cubic-bezier(.22,1,.36,1)" }} />
            </div>
          </div>
        )}
      </div>
      {config.dressCode && (
        <div data-reveal="up" style={{ marginTop: "clamp(48px,6vw,72px)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center", padding: "0 20px" }}>
          <span style={{ font: `600 10.5px/1 ${SANS}`, letterSpacing: ".34em", textTransform: "uppercase", color: "var(--k-x-eyebrow)" }}>Dress Code</span>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(26px,2.6vw,34px)", color: "var(--k-x-ink-strong)" }}>{config.dressCode}</span>
        </div>
      )}
      {live && (
        <div data-reveal="up" style={{ marginTop: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center", padding: "0 20px" }}>
          <span style={{ font: `600 10.5px/1 ${SANS}`, letterSpacing: ".34em", textTransform: "uppercase", color: "var(--k-x-eyebrow)" }}>{live.status === "live" ? "Live now" : "Watch live"}</span>
          <a href={live.stream_url} target="_blank" rel="noopener noreferrer" className={s.link} style={{ display: "inline-flex", alignItems: "center", gap: 12, minHeight: 44, fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(22px,2.2vw,28px)", color: "var(--k-x-ink-strong)" }}>
            Join the ceremony{live.provider ? ` on ${live.provider}` : ""}
            <span aria-hidden="true" style={{ width: 20, height: 1, background: "currentColor" }} />
          </a>
        </div>
      )}
    </section>
  );
}
