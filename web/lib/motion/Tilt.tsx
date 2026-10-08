"use client";

import { useRef } from "react";
import { useMotion } from "./MotionProvider";
import { useFrameThrottled } from "./useFrame";

type Props = {
  strength?: number; // data-tilt amount, default 8deg
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

// 3D tilt toward cursor (mula-fx.js lines 198-205). Fine pointer only; off under
// reduced motion / touch.
export function Tilt({ strength = 8, as = "div", className, style, children }: Props) {
  const { fine, reduce } = useMotion();
  const ref = useRef<HTMLElement>(null);
  const active = fine && !reduce;

  const [onMove, cancelMove] = useFrameThrottled<{ x: number; y: number }>(({ x: cx, y: cy }) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (cx - r.left) / r.width - 0.5;
    const py = (cy - r.top) / r.height - 0.5;
    el.style.transition = "transform .5s cubic-bezier(.2,.8,.2,1)";
    el.style.transform = `perspective(1100px) rotateY(${(px * strength).toFixed(2)}deg) rotateX(${(-py * strength).toFixed(2)}deg) translateZ(0)`;
  });
  const reset = () => {
    cancelMove(); // drop any queued frame so it cannot re-apply the transform after we reset
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} className={className} style={style} onMouseMove={active ? (e: React.MouseEvent) => onMove({ x: e.clientX, y: e.clientY }) : undefined} onMouseLeave={active ? reset : undefined}>
      {children}
    </Tag>
  );
}
