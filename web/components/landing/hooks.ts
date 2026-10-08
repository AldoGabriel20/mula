"use client";

import { useEffect, useRef, useState } from "react";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// rAF-throttled scroll+resize listener (prototype `onScroll` → `tick`). Runs once on mount too.
export function useScrollTick(cb: () => void) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    let raf = 0;
    const run = () => {
      raf = 0;
      ref.current();
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    on();
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

// Prototype `inView(el, .82, .18)`.
export function useInView<T extends HTMLElement>(a = 0.82, b = 0.18) {
  const ref = useRef<T>(null);
  const [inView, set] = useState(false);
  useScrollTick(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const v = r.top < innerHeight * a && r.bottom > innerHeight * b;
    set((p) => (p === v ? p : v));
  });
  return [ref, inView] as const;
}

export function useInterval(cb: () => void, ms: number, on = true) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms, on]);
}

export function useIsMobile(bp = 900) {
  const [m, set] = useState(false);
  useEffect(() => {
    const f = () => set(innerWidth < bp);
    f();
    addEventListener("resize", f);
    return () => removeEventListener("resize", f);
  }, [bp]);
  return m;
}
