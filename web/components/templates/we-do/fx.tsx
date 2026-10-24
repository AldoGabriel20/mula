"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { NoteIcon } from "./art";
import { useWd } from "./context";
import s from "./we-do.module.css";

/** Stagger index for the hero's opening sequence (`--d` steps of 140 ms). */
export const dl = (n: number) => ({ "--d": n }) as CSSProperties;

/** Letters that rise one by one when the invitation opens. Screen readers get the plain word. */
export function Split({ text, base = 0 }: { text: string; base?: number }) {
  return (
    <>
      <span className={s.sr}>{text}</span>
      <span aria-hidden="true">
        {[...text].map((ch, i) => (
          <span key={i} className={s.ch} style={{ "--i": base + i } as CSSProperties}>{ch === " " ? " " : ch}</span>
        ))}
      </span>
    </>
  );
}

/**
 * Gold dust drifting up through the light: a small 2D canvas, full motion only, stepped by the shared ticker and
 * only while it is on screen. One pre-rendered glow sprite, so a frame is a few dozen drawImage calls.
 */
export function Dust({ density = 1 }: { density?: number }) {
  const { engine, motion } = useWd();
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || motion !== "full" || typeof IntersectionObserver === "undefined") return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 32;
    const sc = sprite.getContext("2d")!;
    const g = sc.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,248,226,1)");
    g.addColorStop(0.25, "rgba(240,214,160,.75)");
    g.addColorStop(1, "rgba(200,160,90,0)");
    sc.fillStyle = g;
    sc.fillRect(0, 0, 32, 32);

    let w = 0;
    let h = 0;
    const size = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const n = Math.round(Math.min(64, Math.max(18, (w * h) / 16000)) * density);
    const ps = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 3 + Math.random() * 9, v: 0.12 + Math.random() * 0.4, a: Math.random() * 6.28, tw: 0.4 + Math.random() * 1.2 }));
    const tick = (t: number, dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const k = Math.min(dt, 50) / 16;
      for (const p of ps) {
        p.y -= p.v * k;
        p.x += Math.sin(t / 1800 + p.a) * 0.18 * k;
        if (p.y < -20) {
          p.y = h + 20;
          p.x = Math.random() * w;
        }
        ctx.globalAlpha = 0.25 + 0.6 * Math.sin((t / 1000) * p.tw + p.a) ** 2;
        ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? engine.ticker.tick(tick) : engine.ticker.untick(tick)));
    io.observe(cv);
    const off = engine.listen(window, "resize", size);
    return () => {
      io.disconnect();
      off();
      engine.ticker.untick(tick);
    };
  }, [engine, motion, density]);
  if (motion !== "full") return null;
  return <canvas ref={ref} className={s.dust} aria-hidden="true" />;
}

/**
 * Tilt for 3D cards: writes --rx/--ry (degrees) and --mx/--my (glare position) on the element. A mouse drives it on
 * a desktop; on a phone the device's own tilt does (where the browser gives orientation without a permission prompt).
 */
export function useTilt<T extends HTMLElement>(max = 10) {
  const { fine, motion, engine } = useWd();
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || motion === "off") return;
    const set = (x: number, y: number) => {
      el.style.setProperty("--rx", `${((0.5 - y) * max).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * max).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      el.dataset.tilt = "";
    };
    if (!fine) {
      const D = window.DeviceOrientationEvent as unknown as { requestPermission?: unknown } | undefined;
      if (!D || typeof D.requestPermission === "function") return; // iOS asks first: the CSS float stays
      let base: number | null = null;
      return engine.listen(window, "deviceorientation", (e) => {
        if (e.beta == null || e.gamma == null) return;
        base ??= e.beta;
        const c = (v: number) => Math.min(1, Math.max(0, v));
        set(c(0.5 + e.gamma / 50), c(0.5 + (e.beta - base) / 50));
      });
    }
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    const leave = () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      delete el.dataset.tilt;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [fine, motion, max, engine]);
  return ref;
}

/** The names and the date running past in a band under the hero. Decorative: the same words are in the page. */
export function Marquee() {
  const { config: c, d } = useWd();
  const words = [d.names, d.dots, c.closing.title, c.heroTitle].filter(Boolean);
  const row = (
    <span className={s.mqRow}>
      {words.map((w, i) => (
        <span key={i}>
          <em>{w}</em>
          <b>✦</b>
        </span>
      ))}
    </span>
  );
  return (
    <div className={s.mq} aria-hidden="true">
      <div className={`${s.mqTrack} ${s.loop}`}>
        {row}
        {row}
        {row}
        {row}
      </div>
    </div>
  );
}

const DOCK_ICONS: Record<string, JSX.Element> = {
  top: <path d="M4 11.5 12 5l8 6.5V20h-5.5v-5h-5v5H4z" />,
  countdown: <><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  venue: <><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></>,
  rsvp: <><rect x="3.5" y="6" width="17" height="12.5" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  wishes: <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z" />,
};

/**
 * Floating glass dock: jump links to the main sections plus the music switch. It appears once the guest has
 * scrolled past the hero, and is `inert` (out of the tab order) while hidden.
 */
export function Dock() {
  const { config: c, music, opened } = useWd();
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState("top");
  const nav = useRef<HTMLElement | null>(null);
  const items = [
    ["top", "Home"],
    ["countdown", "Date"],
    ["venue", "Venue"],
    ["rsvp", "RSVP"],
    ...(c.show.wishes ? [["wishes", "Wishes"]] : []),
  ] as [string, string][];

  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShown(!e.isIntersecting), { threshold: 0.35 });
    io.observe(hero);
    const spy = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("[data-template='we-do'] section[id]").forEach((el) => spy.observe(el));
    return () => (io.disconnect(), spy.disconnect());
  }, []);

  const visible = opened && shown;
  // hidden = out of the tab order (React 18 does not pass `inert` through)
  useEffect(() => {
    if (visible) nav.current?.removeAttribute("inert");
    else nav.current?.setAttribute("inert", "");
  }, [visible]);
  const playing = music.state === "playing";
  const hasMusic = c.show.music && !!music.track;
  const label = playing ? "Pause music" : music.state === "loading" ? "Loading music" : music.state === "error" ? "Music unavailable. Tap to try again." : "Play music";
  return (
    <nav ref={nav} className={`${s.dock} ${visible ? s.dockOn : ""}`} aria-label="Invitation sections">
      {items.map(([id, name]) => (
        <a key={id} href={`#${id}`} className={s.dockLink} aria-current={active === id ? "true" : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{DOCK_ICONS[id]}</svg>
          <span>{name}</span>
        </a>
      ))}
      {hasMusic && (
        <button type="button" className={`${s.dockLink} ${s.dockMusic} ${playing ? s.spin : ""}`} onClick={music.toggle} aria-label={label} aria-pressed={playing}>
          <NoteIcon />
        </button>
      )}
    </nav>
  );
}
