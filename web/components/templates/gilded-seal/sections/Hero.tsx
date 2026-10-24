"use client";

import { useEffect } from "react";
import { useGs } from "../context";
import { clamp } from "@/lib/kit/motion/ease";
import { EASE } from "@/lib/kit/motion/ease";
import { Spring, spring } from "@/lib/kit/motion/spring";
import { splitChars } from "../derive";
import { SANS, SCRIPT, SERIF } from "../type";
import { FRAG_BURN, FRAG_CONTOUR } from "../gl/shaders";
import { makeLayer, type GlLayer } from "@/lib/kit/gl/layer";
import { useTheme } from "@/lib/kit/useTheme";
import { LAYER_DPR, themedLayers } from "../gl/layers";
import { heroLayout } from "../layout";
import s from "../gilded-seal.module.css";
import { Photo } from "../parts/Photo";
import { Sprig } from "../parts/Sprig";
import { StackLayer } from "../parts/StackLayer";

const ARCH = "999px 999px 3px 3px";

/**
 * Hero (docs/15 §8.4): a layered CSS-3D world. The couple's portrait stands in an arch with a gilded
 * outline, names float in front, silk and foliage in the near foreground, petals fall through it, and
 * a shader draws the contour-line sheet behind everything. On open, the layers fly in on spring
 * curves and a gilded burn dissolves the paper off the photograph.
 */
export function Hero() {
  const { refs: r, ctl, engine, config, d, vw, vh, reduced, registerFrame, onGl } = useGs();
  const { colors } = useTheme();
  const hl = heroLayout(vw, vh, d.p1, d.p2);
  const chars1 = splitChars(d.p1);
  const chars2 = splitChars(d.p2);
  const target = config.show.opening ? "#statement" : config.show.story ? "#story" : "#date";

  useEffect(() => {
    const root = r.hero.current;
    if (!root) return;
    const fine = () => engine.policy().fine && !engine.policy().reduced;
    const spr = { x: new Spring(0, { tension: 60, friction: 20 }), y: new Spring(0, { tension: 60, friction: 20 }) };
    let heroBgL: GlLayer | null = null;
    let burnL: GlLayer | null = null;
    let heroBgT = 0;

    // ---- petals: a handful of blurred SVG petals at different depths ----
    type Petal = { el: HTMLDivElement; z: number; x: number; y: number; vy: number; sway: number; spin: number; rot: number; a: number };
    const petals: Petal[] = [];
    const box = r.petals.current;
    if (box && !engine.policy().reduced) {
      const n = engine.policy().fine ? 8 : 4;
      for (let i = 0; i < n; i++) {
        const el = document.createElement("div");
        const z = -250 + Math.random() * 650;
        const size = 14 + Math.random() * 16;
        const blur = z > 200 ? (z - 200) / 70 : z < -100 ? (-z - 100) / 120 : 0;
        el.style.cssText = `position:absolute;left:0;top:0;width:${size}px;height:${size * 1.25}px;filter:blur(${blur.toFixed(1)}px);opacity:0;will-change:transform`;
        el.innerHTML = `<svg viewBox="0 0 20 25" width="100%" height="100%"><defs><linearGradient id="gsPetal${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F1DAD3"/><stop offset="1" stop-color="#C99A90"/></linearGradient></defs><path d="M10 0C17 5 20 13 15 21C13 24 7 24 5 21C0 13 3 5 10 0Z" fill="url(#gsPetal${i})"/></svg>`;
        box.appendChild(el);
        petals.push({ el, z, x: Math.random(), y: Math.random() * 1.2 - 0.2, vy: 0.00004 + Math.random() * 0.00005, sway: Math.random() * 6.28, spin: (Math.random() - 0.5) * 0.08, rot: Math.random() * 360, a: 0 });
      }
    }
    const petalFrame = (time: number, dt: number, w: number, h: number) => {
      if (!petals.length || !ctl.petalsOn) return;
      for (const p of petals) {
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        if (p.y > 1.15) {
          p.y = -0.15;
          p.x = Math.random();
        }
        p.a = Math.min(1, p.a + dt / 1500);
        p.el.style.opacity = (0.75 * p.a).toFixed(2);
        p.el.style.transform = `translate3d(${(p.x * w + Math.sin(time * 0.0007 + p.sway) * 40).toFixed(1)}px,${(p.y * h).toFixed(1)}px,${p.z.toFixed(0)}px) rotateX(${(Math.sin(time * 0.001 + p.sway) * 60).toFixed(1)}deg) rotate(${p.rot.toFixed(1)}deg)`;
      }
    };

    // ---- shader layers ----
    const hideBurn = () => {
      if (r.burn.current) r.burn.current.style.display = "none";
    };
    const offGl = onGl((low) => {
      if (low) {
        // software rendering: keep the static paper, no shaders
        if (r.heroBg.current) {
          r.heroBg.current.style.display = "none";
        }
        hideBurn();
        return;
      }
      heroBgL = makeLayer(r.heroBg.current, FRAG_CONTOUR, themedLayers(colors).hero, LAYER_DPR.hero);
      burnL = makeLayer(r.burn.current, FRAG_BURN, themedLayers(colors).burn, LAYER_DPR.burn);
      burnL?.render(); // paper covers the photograph until the burn starts
      if (!burnL) hideBurn();
    });
    const onResize = () => {
      if (burnL && ctl.burnStart == null) burnL.render({ uP: 0 });
    };
    ctl.onResize.push(onResize);

    // ---- per frame ----
    const unframe = registerFrame("hero", (time, dt, w, h) => {
      const f = fine();
      const red = engine.policy().reduced;
      spr.x.target = f ? engine.pointer.x : red ? 0 : Math.sin(time * 0.00028) * 0.45;
      spr.y.target = f ? engine.pointer.y : red ? 0 : Math.cos(time * 0.00021) * 0.3;
      spr.x.step(dt);
      spr.y.step(dt);
      const first = ctl.stack?.layers[0];
      const dolly = first ? Math.max(0, first.p) : 0;
      const cam = r.heroCam.current;
      if (cam) cam.style.transform = `translateZ(${(dolly * 260).toFixed(1)}px) rotateX(${(-spr.y.v * 2.4).toFixed(3)}deg) rotateY(${(spr.x.v * 3.4).toFixed(3)}deg)`;
      petalFrame(time, dt, w, h);
      if (heroBgL && !red && time - heroBgT > 33) {
        heroBgT = time;
        heroBgL.render({ uTime: time / 1000, uPointer: [spr.x.v, -spr.y.v] });
      }
      if (burnL && ctl.burnStart != null) {
        const p = clamp((time - ctl.burnStart) / 2600);
        burnL.render({ uP: p });
        if (p >= 1) {
          burnL.destroy();
          burnL = null;
          hideBurn();
        }
      }
    });

    // ---- entrance, played when the cover starts to leave (prototype `playHero`) ----
    ctl.heroPlay = (delay: number) => {
      const bg = r.heroBg.current;
      if (bg) bg.style.opacity = "1";
      if (engine.policy().reduced) {
        ctl.burnStart = -1e9;
        ctl.petalsOn = false;
        return;
      }
      const sp = spring(95, 15);
      ctl.burnStart = performance.now() + delay + 250;
      engine.later(delay + 900, () => {
        ctl.petalsOn = true;
      });
      const add = (el: Element | null, kf: Keyframe[], o: KeyframeAnimationOptions) => {
        if (!el) return;
        const a = el.animate(kf, { fill: "both", easing: EASE.out, ...o });
        a.onfinish = () => a.cancel();
        ctl.heroAnims.push(a);
      };
      const q = (sel: string) => root.querySelector<HTMLElement>(sel);
      const qa = (sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];
      const based = (el: HTMLElement | null, extra: string, from: Keyframe, to: Keyframe): Keyframe[] => {
        const b = (el && el.style.transform) || "";
        return [{ transform: `${b} ${extra}`, ...from }, { transform: b || "none", ...to }];
      };
      add(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 1800, delay });
      const far = q('[data-hero="far"]');
      const mono = q('[data-hero="mono"]');
      const outline = q('[data-hero="outline"]');
      const silk = q('[data-hero="silk"]');
      add(far, based(far, "translateY(70px)", { opacity: 0 }, { opacity: 1 }), { duration: 2600, delay });
      add(mono, based(mono, "scale(.88)", { opacity: 0 }, { opacity: 1 }), { duration: 2600, delay: delay + 200 });
      add(q('[data-hero="photo"]'), [{ transform: "translate3d(0,60px,-280px) rotateY(-14deg) rotateX(5deg)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 2400, delay });
      add(q('[data-hero="img"]'), [{ transform: "scale(1.18)" }, { transform: "none" }], { duration: 3000, delay });
      add(outline, based(outline, "scale(.92)", { opacity: 0 }, { opacity: 1 }), { duration: 1900, delay: delay + 700 });
      add(silk, based(silk, "translateX(-22%)", { opacity: 0 }, { opacity: 1 }), { duration: 3000, delay: delay + 800 });
      qa('[data-hero="fg"]').forEach((el) => {
        const side = +(el.dataset.fg || 0);
        add(el, based(el, `translate(${side * -26}%, ${side * 26}%) scale(1.2)`, { opacity: 0 }, { opacity: 0.9 }), { duration: 2600, delay: delay + 100 });
      });
      qa('[data-hero="up"]').forEach((el, i) => add(el, [{ opacity: 0, transform: "translateY(.6em)" }, { opacity: 1, transform: "none" }], { duration: 1300, delay: delay + (i === 0 ? 300 : 1000 + i * 120), easing: sp }));
      qa("[data-ch]").forEach((el, i) => add(el, [{ opacity: 0, transform: "translateY(.3em)" }, { opacity: 1, transform: "none" }], { duration: 1200, delay: delay + 420 + i * 45, easing: sp }));
      const amp = q('[data-hero="amp"]');
      add(amp, [{ opacity: 0, transform: "scale(.6) rotate(-14deg)" }, { opacity: 1, transform: "none" }], { duration: 1500, delay: delay + 800, easing: sp });
      add(amp, [{ backgroundPosition: "100% 0" }, { backgroundPosition: "0% 0" }], { duration: 2600, delay: delay + 1000, easing: EASE.inOut });
      add(q('[data-hero="fade"]'), [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, delay: delay + 1800 });
    };

    return () => {
      unframe();
      offGl();
      ctl.heroPlay = null;
      ctl.onResize = ctl.onResize.filter((f) => f !== onResize);
      heroBgL?.destroy();
      burnL?.destroy();
      petals.forEach((p) => p.el.remove());
    };
  }, [r, ctl, engine, registerFrame, onGl, colors]);

  return (
    <StackLayer z={0}>
      <section ref={r.hero} data-vis="hero" aria-label={`The wedding of ${d.couple}`} style={{ position: "relative", height: "100svh", minHeight: 540, overflow: "hidden", background: "#F5EEE3", isolation: "isolate" }}>
        <canvas ref={r.heroBg} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", opacity: 0 }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(55% 55% at 72% 40%,rgba(220,192,185,.42) 0%,rgba(220,192,185,0) 70%),radial-gradient(45% 45% at 8% 96%,rgba(163,165,140,.22) 0%,rgba(163,165,140,0) 70%)" }} />
        <div style={{ position: "absolute", inset: 0, perspective: 1100, perspectiveOrigin: "50% 45%" }}>
          <div ref={r.heroCam} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
            <div data-hero="far" aria-hidden="true" style={{ position: "absolute", inset: 0, transform: "translateZ(-700px) scale(1.64)", pointerEvents: "none" }}>
              {[
                { l: "4%", h: "78%", a: 0.22, b: 0.55 },
                { l: "40%", h: "88%", a: 0.2, b: 0.45 },
                { l: "76%", h: "78%", a: 0.22, b: 0.55 },
              ].map((o) => (
                <div key={o.l} style={{ position: "absolute", left: o.l, bottom: "-6%", width: "20%", height: o.h, borderRadius: "999px 999px 0 0", border: `1px solid rgba(199,166,106,${o.a})`, background: `linear-gradient(180deg,rgba(255,252,246,0) 0%,rgba(226,214,198,${o.b}) 100%)` }} />
              ))}
            </div>

            <div data-hero="mono" aria-hidden="true" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate3d(-50%,-54%,-320px) scale(1.29)", fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: "38vw", lineHeight: 1, color: "rgba(199,166,106,.12)", whiteSpace: "nowrap", pointerEvents: "none" }}>
              {d.ini1}&amp;{d.ini2}
            </div>

            <div data-hero="photo" style={{ position: "absolute", left: hl.pL, top: hl.pT, width: hl.pW, height: hl.pH, transformStyle: "preserve-3d" }}>
              <div aria-hidden="true" style={{ position: "absolute", left: "6%", right: "6%", bottom: "-6%", height: "12%", transform: "translateZ(-40px) scale(1.036)", background: "radial-gradient(ellipse at center,rgba(70,45,28,.34) 0%,rgba(70,45,28,0) 70%)", filter: "blur(10px)" }} />
              <div data-hero="outline" aria-hidden="true" style={{ position: "absolute", top: -18, left: -18, right: 18, bottom: 18, transform: "translateZ(-90px) scale(1.082)", border: "1px solid rgba(199,166,106,.8)", borderRadius: ARCH, pointerEvents: "none" }} />
              <div data-hero="frame" style={{ position: "absolute", inset: 0, borderRadius: ARCH, overflow: "hidden", background: "linear-gradient(165deg,#EADBD1 0%,#D8C2B6 55%,#C6AF9F 100%)", boxShadow: "0 60px 100px -50px rgba(60,40,25,.55)" }}>
                <div data-hero="img" style={{ position: "absolute", inset: 0 }}>
                  <Photo photo={config.photos.hero} eager />
                </div>
                <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "40%", pointerEvents: "none", opacity: hl.fade, background: "linear-gradient(180deg,rgba(245,238,227,0) 0%,rgba(245,238,227,.9) 80%,#F5EEE3 100%)" }} />
                <canvas ref={r.burn} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
              </div>
            </div>

            <div data-hero="silk" aria-hidden="true" style={{ position: "absolute", left: "-15%", width: "130%", top: hl.silkT, height: 150, transform: "translateZ(130px) rotate(-8deg) scale(.882)", pointerEvents: "none", borderRadius: "50%", filter: "blur(16px)", background: "linear-gradient(90deg,rgba(255,253,248,0) 0%,rgba(255,253,248,.6) 26%,rgba(244,224,218,.42) 54%,rgba(255,253,248,.55) 76%,rgba(255,253,248,0) 100%)" }} />

            <div data-hero="text" style={{ position: "absolute", left: hl.tL, top: hl.tT, width: hl.tW, transform: "translateZ(60px) scale(.945)", display: "flex", flexDirection: "column", alignItems: hl.align, textAlign: hl.talign, gap: hl.gap }}>
              <div data-hero="up" style={{ display: "flex", alignItems: "center", gap: 16, font: `600 11px/1 ${SANS}`, letterSpacing: ".36em", textTransform: "uppercase", color: "var(--k-x-eyebrow)" }}>
                <span style={{ width: 44, height: 1, background: "var(--k-line)" }} />
                {config.heroTitle}
              </div>
              <h1 ref={r.heading} tabIndex={-1} aria-label={d.couple} style={{ margin: 0, fontFamily: SERIF, fontWeight: 300, fontSize: hl.ns, lineHeight: 0.94, letterSpacing: "-.02em", color: "var(--k-x-ink-strong)", outline: "none" }}>
                <span aria-hidden="true" style={{ display: "block", whiteSpace: "nowrap" }}>
                  {chars1.map((ch, i) => (
                    <span key={i} data-ch="" style={{ display: "inline-block" }}>
                      {ch.c}
                    </span>
                  ))}
                </span>
                <span aria-hidden="true" data-hero="amp" style={{ display: "block", width: "fit-content", margin: hl.ampM, fontFamily: SCRIPT, fontSize: ".82em", lineHeight: 1, padding: "0 .12em", background: "linear-gradient(100deg,#8E6E3E 0%,var(--k-accent-soft) 28%,#A8864C 48%,#F1E3C2 66%,#8E6E3E 100%)", backgroundSize: "260% 100%", backgroundPosition: "0% 0", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                  &amp;
                </span>
                <span aria-hidden="true" style={{ display: "block", whiteSpace: "nowrap", paddingLeft: hl.indent }}>
                  {chars2.map((ch, i) => (
                    <span key={i} data-ch="" style={{ display: "inline-block" }}>
                      {ch.c}
                    </span>
                  ))}
                </span>
              </h1>
              {d.valid && (
                <div data-hero="up" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: hl.align, gap: "10px 18px", font: `500 12px/1.4 ${SANS}`, letterSpacing: ".28em", textTransform: "uppercase", color: "#3E332B" }}>
                  <span>{d.weekday}</span>
                  <span aria-hidden="true" style={{ width: 6, height: 6, transform: "rotate(45deg)", border: "1px solid var(--k-line)" }} />
                  <span>{d.displayDate}</span>
                </div>
              )}
              {hl.line && (
                <p data-hero="up" style={{ margin: 0, maxWidth: "30ch", fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(21px,1.8vw,26px)", lineHeight: 1.45, color: "var(--k-ink-soft)", textWrap: "pretty" }}>
                  {config.heroLine}
                </p>
              )}
              <div data-hero="up" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: hl.align, gap: "12px 26px" }}>
                <a href="#rsvp" className={s.pill} style={{ display: "inline-flex", alignItems: "center", minHeight: 48, padding: "0 28px", borderRadius: 999, background: "var(--k-ink)", color: "var(--k-bg)", font: `600 11px/1 ${SANS}`, letterSpacing: ".3em", textTransform: "uppercase", transition: "background .4s ease" }}>
                  Kindly RSVP
                </a>
                <a href="#details" className={s.link} style={{ display: "inline-flex", alignItems: "center", gap: 12, minHeight: 48, font: `600 11px/1 ${SANS}`, letterSpacing: ".3em", textTransform: "uppercase", color: "var(--k-ink)" }}>
                  The Celebration
                  <span aria-hidden="true" style={{ width: 20, height: 1, background: "currentColor" }} />
                </a>
              </div>
            </div>

            <div ref={r.petals} aria-hidden="true" style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", pointerEvents: "none" }} />

            <div data-hero="fg" data-fg="-1" aria-hidden="true" style={{ position: "absolute", left: "-16%", bottom: "-26%", width: "min(48vw,560px)", transform: "translateZ(380px) scale(.655)", filter: "blur(5px)", opacity: 0.9, pointerEvents: "none" }}>
              <Sprig transform="rotate(30deg)" leaves={6} />
            </div>
            <div data-hero="fg" data-fg="1" aria-hidden="true" style={{ position: "absolute", right: "-13%", top: "-20%", width: "min(40vw,460px)", transform: "translateZ(300px) scale(.727)", filter: "blur(4px)", opacity: 0.85, pointerEvents: "none" }}>
              <Sprig transform="rotate(204deg)" leaves={5} fillAlpha={0.5} berries={[0, 1, 2]} />
            </div>
          </div>
        </div>
        <a href={target} data-hero="fade" aria-label="Scroll to continue" style={{ position: "absolute", left: "50%", bottom: 16, translate: "-50% 0", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, font: `600 9.5px/1 ${SANS}`, letterSpacing: ".4em", textTransform: "uppercase", color: "var(--k-ink-soft)", padding: "6px 12px" }}>
          Scroll
          <span style={{ position: "relative", width: 1, height: 44, background: "rgba(176,142,82,.45)", overflow: "hidden" }}>
            <span ref={r.scrollDot} style={{ position: "absolute", left: -1, top: 0, width: 3, height: 12, borderRadius: 2, background: "var(--k-accent)" }} />
          </span>
        </a>
      </section>
    </StackLayer>
  );
}
