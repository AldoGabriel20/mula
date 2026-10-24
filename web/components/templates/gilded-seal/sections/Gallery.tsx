"use client";

import { useEffect, type CSSProperties } from "react";
import { useGs } from "../context";
import { clamp } from "@/lib/kit/motion/ease";
import { Spring } from "@/lib/kit/motion/spring";
import { SANS } from "../type";
import { figureOpacity, galleryPlan } from "../layout";
import { Photo } from "../parts/Photo";
import { Eyebrow, Heading } from "../parts/ui";

const TINTS = [
  ["#E8D9CE", "#CDB5A8"],
  ["#E4DBCB", "#C9BCA4"],
  ["#E6D3CC", "#C7AA9F"],
  ["#DFD9C8", "#BDB59C"],
  ["#EAD9CF", "#CFB2A6"],
  ["#E6DCCB", "#C8B79E"],
  ["#E9D6CF", "#CBAEA3"],
  ["#E0D9C9", "#BFB49D"],
];
const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Gallery (docs/15 §8.11): the photographs hang in a 3D corridor and scrolling flies the camera
 * through it (a tall sticky section, the camera depth follows scroll progress). Each figure fades in
 * from the distance and out as it passes. Reduced motion gets a plain responsive grid instead.
 */
export function Gallery() {
  const { refs: r, ctl, engine, config, reduced, registerFrame } = useGs();
  const photos = config.gallery;
  const plan = galleryPlan(photos.length);
  const show = config.show.gallery;

  useEffect(() => {
    const sec = r.gallery.current;
    if (!sec || reduced) return;
    const sx = new Spring(0, { tension: 50, friction: 20 });
    const sy = new Spring(0, { tension: 50, friction: 20 });
    const figs = [...sec.querySelectorAll<HTMLElement>("[data-g]")].map((el) => ({ el, z: +(el.dataset.z || 0), o: -1 }));
    return registerFrame("gallery", (_t, dt, _w, vh) => {
      const rect = sec.getBoundingClientRect();
      if (rect.bottom < -50 || rect.top > vh + 50) return;
      const g = clamp(-rect.top / Math.max(1, rect.height - vh));
      const camZ = g * plan.camZMax;
      const fine = engine.policy().fine;
      sx.target = fine ? engine.pointer.x : 0;
      sy.target = fine ? engine.pointer.y : 0;
      sx.step(dt);
      sy.step(dt);
      if (r.galleryCam.current) r.galleryCam.current.style.transform = `rotateY(${(sx.v * -2.2).toFixed(3)}deg) rotateX(${(sy.v * 1.6).toFixed(3)}deg) translateZ(${camZ.toFixed(1)}px)`;
      let near = 0;
      let best = 1e9;
      for (const f of figs) {
        const d = f.z + camZ;
        const o = figureOpacity(f.z, camZ);
        if (Math.abs(o - f.o) > 0.004) {
          f.o = o;
          f.el.style.opacity = o.toFixed(3);
          f.el.style.visibility = o <= 0.001 ? "hidden" : "visible";
        }
        const dist = Math.abs(d + 300);
        if (dist < best) {
          best = dist;
          near = +(f.el.dataset.g || 0);
        }
      }
      const label = `${pad2(near + 1)} / ${pad2(figs.length)}`;
      const c = r.galleryCount.current;
      if (c && c.textContent !== label) c.textContent = label;
      if (r.galleryBar.current) r.galleryBar.current.style.transform = `scaleX(${g.toFixed(4)})`;
    });
  }, [r, engine, reduced, registerFrame, plan.camZMax, photos.length]);

  if (!show) return null;

  const flat = reduced;
  const stickyStyle: CSSProperties = flat
    ? { position: "relative", height: "auto", padding: "clamp(170px,24vh,240px) clamp(20px,6vw,96px) 110px", overflow: "hidden", background: "radial-gradient(65% 60% at 50% 52%,#FAF5EC 0%,#ECE2D3 70%,#E2D6C4 100%)" }
    : { position: "sticky", top: 0, height: "100svh", overflow: "hidden", background: "radial-gradient(65% 60% at 50% 52%,#FAF5EC 0%,#ECE2D3 70%,#E2D6C4 100%)" };

  return (
    <section id="gallery" ref={r.gallery} data-vis="gallery" aria-label="Photo gallery" style={{ position: "relative", height: flat ? "auto" : `${plan.heightSvh}svh`, background: "#EEE5D8" }}>
      <div ref={r.gallerySticky} style={stickyStyle}>
        <div ref={r.galleryStage} style={flat ? { position: "relative" } : { position: "absolute", inset: 0, perspective: 900, perspectiveOrigin: "50% 50%" }}>
          <div ref={r.galleryCam} style={flat ? { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,220px),1fr))", gap: "44px 16px" } : { position: "absolute", left: "50%", top: "53%", width: 0, height: 0, transformStyle: "preserve-3d" }}>
            {photos.map((p, i) => {
              const f = plan.figures[i];
              const [a, b] = TINTS[i % TINTS.length];
              const style: CSSProperties = flat
                ? { position: "relative", margin: 0, aspectRatio: "4/5", background: `linear-gradient(160deg,${a},${b})`, boxShadow: "0 40px 80px -40px rgba(60,40,25,.5)" }
                : { position: "absolute", left: 0, top: 0, margin: 0, width: "min(60vw,44svh)", aspectRatio: "4/5", transform: `translate(-50%,-50%) translate3d(${f.x}vw,${f.y}svh,${f.z}px) rotateY(${f.rot}deg)`, background: `linear-gradient(160deg,${a},${b})`, boxShadow: "0 40px 80px -40px rgba(60,40,25,.5)" };
              return (
                <figure key={i} data-g={i} data-z={f.z} style={style}>
                  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                    <Photo photo={p} />
                  </div>
                  <figcaption style={{ position: "absolute", left: 0, bottom: -30, font: `600 10px/1 ${SANS}`, letterSpacing: ".3em", color: "var(--k-x-eyebrow)" }}>{pad2(i + 1)}</figcaption>
                  {p.url && (
                    <button type="button" onClick={() => ctl.lightbox.set(i)} aria-label={`View photo ${i + 1} full screen`} style={{ position: "absolute", right: 10, bottom: 10, zIndex: 2, width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(199,166,106,.55)", background: "rgba(252,249,243,.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--k-ink)" strokeWidth="1.2" aria-hidden="true">
                        <path d="M1 5V1h4M11 1h4v4M15 11v4h-4M5 15H1v-4" />
                      </svg>
                    </button>
                  )}
                </figure>
              );
            })}
          </div>
        </div>
        <div ref={r.galleryHead} style={flat ? { position: "absolute", left: "clamp(20px,6vw,96px)", top: "clamp(60px,10vh,100px)", display: "flex", flexDirection: "column", gap: 18, maxWidth: "min(520px,80vw)" } : { position: "absolute", left: "clamp(20px,6vw,96px)", top: "clamp(28px,8vh,90px)", zIndex: 4, display: "flex", flexDirection: "column", gap: 18, pointerEvents: "none", maxWidth: "min(520px,80vw)" }}>
          <Eyebrow reveal={null}>Gallery</Eyebrow>
          <Heading k="gallery" override={config.titles.gallery} reveal={null} size="clamp(42px,5.4vw,80px)" />
        </div>
        {!flat && (
          <div style={{ position: "absolute", left: "clamp(20px,6vw,96px)", right: "clamp(84px,8vw,140px)", bottom: "clamp(22px,5vh,48px)", zIndex: 4, display: "flex", alignItems: "center", gap: 18, font: `600 10px/1 ${SANS}`, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--k-ink-soft)", pointerEvents: "none" }}>
            <span ref={r.galleryCount} style={{ minWidth: 64 }}>{`01 / ${pad2(photos.length)}`}</span>
            <span style={{ position: "relative", flex: 1, height: 1, background: "rgba(176,142,82,.3)" }}>
              <span ref={r.galleryBar} style={{ position: "absolute", inset: 0, background: "var(--k-accent)", transform: "scaleX(0)", transformOrigin: "0 50%" }} />
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
