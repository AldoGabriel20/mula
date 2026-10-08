"use client";

import { useEffect, useState } from "react";
import { useLang } from "../i18n";

export const PX = "clamp(20px,3.6vw,52px)";
export const WRAP = { maxWidth: 1440, margin: "0 auto" } as const;
export const BROWN = "#8A5F38";

// Prototype `lum` — perceived luminance of a hex colour, 0..1.
export const lum = (hex: string) => {
  const h = (hex || "#000000").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

// Target of every countdown in the prototype.
export const EVENT_DATE = new Date("2027-04-12T16:00:00").getTime();

// Re-renders every second (prototype `setInterval(setState({ now }), 1000)`); null until mounted.
export function useNow(ms = 1000) {
  const [now, set] = useState<number | null>(null);
  useEffect(() => {
    set(Date.now());
    const id = setInterval(() => set(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

// Equaliser bars (keyframes `mulaEq` live in landing.module.css, exported global).
export function Eq({ n, w, h, color, gap, dur, delay }: { n: number; w: number; h: number; color: string; gap: number; dur: (k: number) => number; delay: (k: number) => number }) {
  return (
    <span style={{ display: "inline-flex", gap, alignItems: "flex-end", height: h }}>
      {Array.from({ length: n }, (_, k) => (
        <span key={k} style={{ width: w, height: h, background: color, transformOrigin: "bottom", animation: `mulaEq ${dur(k)}s ${delay(k)}s infinite ease-in-out` }} />
      ))}
    </span>
  );
}

// "Text <em>emphasis</em>" with each segment translated independently, like the prototype's text walker.
export function Em({ a, b }: { a: string; b: string }) {
  const { tr } = useLang();
  return (
    <>
      {tr(a)}
      <em>{tr(b)}</em>
    </>
  );
}
