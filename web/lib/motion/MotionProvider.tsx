"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Detect reduced-motion + fine-pointer once (mula-fx.js lines 5-6) and share them.
// Every motion primitive reads this so gating is consistent and SSR-safe.
type MotionCaps = { reduce: boolean; fine: boolean };

const MotionContext = createContext<MotionCaps>({ reduce: false, fine: false });

export const useMotion = () => useContext(MotionContext);

function detectFine(): boolean {
  if (typeof window === "undefined") return false;
  const touch = "ontouchstart" in window && navigator.maxTouchPoints > 0 && !matchMedia("(hover: hover)").matches;
  return matchMedia("(pointer: fine)").matches && !touch;
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  // Start reduce=true / fine=false so SSR and first paint do the safe (static) thing.
  const [caps, setCaps] = useState<MotionCaps>({ reduce: true, fine: false });

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setCaps({ reduce: mq.matches, fine: detectFine() });
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return <MotionContext.Provider value={caps}>{children}</MotionContext.Provider>;
}
