"use client";

import { useEffect, useRef, useState } from "react";
import { useMotion } from "./MotionProvider";

const EASE = "cubic-bezier(.2,.75,.15,1)"; // mula-fx.js EASE

type Kind = "default" | "mask" | "scale" | "blur";

type Props = {
  kind?: Kind;
  wait?: number; // ms delay (data-reveal-wait / data-delay)
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

// Hidden styles per kind, mirroring mula-fx.js prep() (lines 140-143).
const hidden: Record<Kind, React.CSSProperties> = {
  default: { opacity: 0, transform: "translateY(36px)", filter: "blur(6px)" },
  mask: { opacity: 0, clipPath: "inset(0 0 100% 0)", transform: "translateY(30px)" },
  scale: { opacity: 0, transform: "scale(.92)", filter: "blur(8px)" },
  blur: { opacity: 0, filter: "blur(14px)", transform: "translateY(16px)" },
};
const shown: React.CSSProperties = {
  opacity: 1,
  transform: "none",
  filter: "none",
  clipPath: "inset(0 0 0 0)",
};
// Delay lives inside the shorthand (not transitionDelay) so React never sees a mixed shorthand/longhand.
const transition = (wait: number) =>
  [["opacity", 1.1], ["transform", 1.3], ["filter", 1.1], ["clip-path", 1.4]].map(([p, d]) => `${p} ${d}s ${EASE} ${wait}ms`).join(", ");

export function Reveal({ kind = "default", wait = 0, as = "div", className, style: base, children }: Props) {
  const { reduce } = useMotion();
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduce) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }, // fire ~90% down the viewport, like check()'s innerHeight*0.9
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  const Tag = as as React.ElementType;
  const style: React.CSSProperties = reduce
    ? { ...base }
    : {
        ...base,
        transition: transition(wait),
        ...(visible ? shown : hidden[kind]),
      };

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
