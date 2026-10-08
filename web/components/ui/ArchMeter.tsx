"use client";

import { useEffect, useState } from "react";
import { useMotion } from "@/lib/motion";

type Props = {
  value: number; // 0..100
  segments?: number; // discrete parts (readiness = 9)
  size?: number; // px width
  label?: string; // accessible description
};

// Brand arch (logo path) as a progress meter. Track + animated --dot fill, with
// segment dividers cut through in the surface colour. pathLength=100 makes the
// dash math independent of the path geometry.
const ARCH = "M8 25V14a12 12 0 0 1 24 0v11";
const STROKE = 2.4;

export function ArchMeter({ value, segments = 9, size = 72, label }: Props) {
  const { reduce } = useMotion();
  const clamped = Math.max(0, Math.min(100, value));
  // Animate from 0 → value on mount (instant under reduced motion).
  const [shown, setShown] = useState(reduce ? clamped : 0);
  useEffect(() => {
    if (reduce) {
      setShown(clamped);
      return;
    }
    const id = requestAnimationFrame(() => setShown(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped, reduce]);

  const seg = segments > 1 ? 100 / segments : 0;

  return (
    <svg
      viewBox="0 0 40 26"
      width={size}
      height={(size * 26) / 40}
      fill="none"
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Readiness"}
    >
      {/* track */}
      <path d={ARCH} stroke="var(--line2)" strokeWidth={STROKE} strokeLinecap="round" pathLength={100} />
      {/* progress */}
      <path
        d={ARCH}
        stroke="var(--dot)"
        strokeWidth={STROKE}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${shown} 100`}
        style={reduce ? undefined : { transition: "stroke-dasharray .8s var(--eo)" }}
      />
      {/* segment dividers (cut through in surface colour) */}
      {seg > 0 &&
        Array.from({ length: segments - 1 }).map((_, i) => (
          <path
            key={i}
            d={ARCH}
            stroke="var(--arch-gap, var(--bg))"
            strokeWidth={STROKE + 1}
            pathLength={100}
            strokeDasharray={`1.2 ${100 - 1.2}`}
            strokeDashoffset={-(seg * (i + 1)) + 0.6}
          />
        ))}
    </svg>
  );
}

export default ArchMeter;
