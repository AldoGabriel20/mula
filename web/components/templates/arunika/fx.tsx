"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { bouquet, seal, type BouquetOpts } from "./art";
import { useAr } from "./context";
import s from "./arunika.module.css";

/** Reveal classes: `rv(2)` = reveal with the second stagger step. */
export const rv = (step = 0) => (step ? `${s.rv} ${s[`d${step}`]}` : s.rv);

/** A painted bouquet: one element with the bouquet as its background, swaying from its stems. */
export function Bq({ seed, o, className = "", style }: { seed: number; o?: BouquetOpts; className?: string; style?: CSSProperties }) {
  const img = useMemo(() => bouquet(seed, o), [seed, o]);
  return (
    <div className={`${s.bq} ${className}`} style={style} aria-hidden="true">
      <div className={`${s.bqImg} ${s.loop}`} style={{ backgroundImage: img, animationDelay: `${-(seed % 7)}s` }} />
    </div>
  );
}

/** A wax seal with the couple's initials. */
export function Seal({ seed, className = "", style }: { seed: number; className?: string; style?: CSSProperties }) {
  const { d } = useAr();
  return <div className={`${s.seal} ${className}`} style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: seal(seed, d.ini1, d.ini2) }} />;
}

/** Concave-cornered double frame drawn to the parent's real size (it re-draws when the card resizes). */
export function Frame({ light = false }: { light?: boolean }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [box, setBox] = useState<[number, number] | null>(null);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const read = () => setBox([el.offsetWidth, el.offsetHeight]);
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const path = (w: number, h: number, i: number, r: number) =>
    `M${i + r} ${i}H${w - i - r}A${r} ${r} 0 0 0 ${w - i} ${i + r}V${h - i - r}A${r} ${r} 0 0 0 ${w - i - r} ${h - i}H${i + r}A${r} ${r} 0 0 0 ${i} ${h - i - r}V${i + r}A${r} ${r} 0 0 0 ${i + r} ${i}Z`;
  const [w, h] = box ?? [0, 0];
  const u = Math.max(4, Math.min(w, h) * 0.035);
  return (
    <svg ref={ref} className={`${s.frame} ${light ? s.frameLight : ""}`} viewBox={`0 0 ${w || 1} ${h || 1}`} aria-hidden="true" focusable="false">
      {box && w > 0 && (
        <>
          <path d={path(w, h, u, u * 1.1)} strokeWidth="1.3" />
          <path d={path(w, h, u * 1.55, u * 0.8)} strokeWidth=".7" />
        </>
      )}
    </svg>
  );
}

/**
 * Depth for a layered scene: writes --px/--py (-1..1) on the element. A mouse drives it on a desktop; on a phone the
 * device's own tilt does (where the browser gives orientation without a permission prompt). Each layer moves by its
 * own `--z` in the stylesheet, so the collage reads as paper stacked at different heights.
 */
export function useDepth<T extends HTMLElement>() {
  const { fine, motion, engine } = useAr();
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || motion !== "full") return;
    let raf = 0;
    const set = (x: number, y: number) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", x.toFixed(3));
        el.style.setProperty("--py", y.toFixed(3));
      });
    };
    const c = (v: number) => Math.min(1, Math.max(-1, v));
    if (!fine) {
      const D = window.DeviceOrientationEvent as unknown as { requestPermission?: unknown } | undefined;
      if (!D || typeof D.requestPermission === "function") return; // iOS asks first: the layers stay put
      let base: number | null = null;
      const off = engine.listen(window, "deviceorientation", (e) => {
        if (e.beta == null || e.gamma == null) return;
        base ??= e.beta;
        set(c(e.gamma / 25), c((e.beta - base) / 25));
      });
      return () => (off(), cancelAnimationFrame(raf));
    }
    const off = engine.listen(window, "pointermove", (e) => set(c((e.clientX / innerWidth) * 2 - 1), c((e.clientY / innerHeight) * 2 - 1)));
    return () => (off(), cancelAnimationFrame(raf));
  }, [fine, motion, engine]);
  return ref;
}

/** Petals for the opening shower: fixed positions (no layout shift between renders), CSS does the falling. */
const PETALS = Array.from({ length: 22 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { x: r(1) * 100, d: r(2) * 0.9, t: 2.2 + r(3) * 1.6, s: 10 + r(4) * 14, sw: (r(5) - 0.5) * 40, rot: r(6) * 360, k: i % 3 };
});
export function Petals() {
  return (
    <div className={s.petals} aria-hidden="true">
      {PETALS.map((p, i) => (
        <i key={i} className={s[`pt${p.k}`]} style={{ "--x": `${p.x}%`, "--dl": `${p.d}s`, "--t": `${p.t}s`, "--sz": `${p.s}px`, "--sw": `${p.sw}vw`, "--rot": `${p.rot}deg` } as CSSProperties} />
      ))}
    </div>
  );
}
