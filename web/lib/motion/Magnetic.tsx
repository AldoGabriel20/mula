"use client";

import { useRef } from "react";
import { useMotion } from "./MotionProvider";
import { useFrameThrottled } from "./useFrame";

type Props = {
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

// Magnetic hover (mula-fx.js lines 188-195): translate toward cursor + scale 1.03,
// spring back on leave. Fine pointer only; disabled under reduced motion.
export function Magnetic({ as = "span", className, style, children }: Props) {
  const { fine, reduce } = useMotion();
  const ref = useRef<HTMLElement>(null);
  const active = fine && !reduce;

  // React pools nothing in v17+, but capture only the numbers we need so the rAF callback never
  // touches a stale synthetic event.
  const [onMove, cancelMove] = useFrameThrottled<{ x: number; y: number }>(({ x: cx, y: cy }) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (cx - r.left - r.width / 2) * 0.22;
    const y = (cy - r.top - r.height / 2) * 0.3;
    el.style.transition = "transform .35s cubic-bezier(.2,.8,.2,1)";
    el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(1.03)`;
    const ar = el.querySelector<HTMLElement>("[data-arrow]"); // mula-fx.js: arrow nudges right
    if (ar) {
      ar.style.transition = "transform .35s cubic-bezier(.2,.8,.2,1)";
      ar.style.transform = "translateX(5px)";
    }
  });
  const reset = () => {
    cancelMove(); // drop any queued frame so it cannot re-apply the transform after we reset
    const el = ref.current;
    if (el) {
      el.style.transform = "";
      const ar = el.querySelector<HTMLElement>("[data-arrow]");
      if (ar) ar.style.transform = "";
    }
  };

  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={className}
      style={{ display: "inline-flex", ...style }}
      onMouseMove={active ? (e: React.MouseEvent) => onMove({ x: e.clientX, y: e.clientY }) : undefined}
      onMouseLeave={active ? reset : undefined}
    >
      {children}
    </Tag>
  );
}
