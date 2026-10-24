import type { CSSProperties, ReactNode } from "react";
import { DEFAULT_HEADINGS, headingParts } from "../derive";
import { SANS, SERIF } from "../type";

/** Small caps label above a heading: Manrope 600 11px, .36em tracking. */
export function Eyebrow({ children, color = "var(--k-x-eyebrow)", reveal = "fade", delay, style }: { children: ReactNode; color?: string; reveal?: string | null; delay?: number; style?: CSSProperties }) {
  return (
    <div data-reveal={reveal ?? undefined} data-delay={delay} style={{ font: `600 11px/1 ${SANS}`, letterSpacing: ".36em", textTransform: "uppercase", color, ...style }}>
      {children}
    </div>
  );
}

/** Section heading: Cormorant 300, last words in the rose italic accent. */
export function Heading({ k, override, size = "clamp(46px,5.6vw,82px)", color = "var(--k-x-ink-strong)", reveal = "up", style }: { k: keyof typeof DEFAULT_HEADINGS; override?: string; size?: string; color?: string; reveal?: string | null; style?: CSSProperties }) {
  const [lead, em] = headingParts(k, override);
  return (
    <h2 data-reveal={reveal ?? undefined} style={{ margin: 0, fontFamily: SERIF, fontWeight: 300, fontSize: size, lineHeight: 1, letterSpacing: "-.015em", color, ...style }}>
      {lead}
      <em style={{ fontStyle: "italic", color: "#8C6B67" }}>{em}</em>
    </h2>
  );
}

/** Tiny 16×16 chevron used by the round carousel buttons. */
export const Chevron = ({ dir, size = 16, stroke = "currentColor" }: { dir: "l" | "r"; size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.3" aria-hidden="true">
    <path d={dir === "l" ? "M10 2L4 8L10 14" : "M6 2L12 8L6 14"} />
  </svg>
);

export const ROUND_BTN: CSSProperties = { flex: "none", borderRadius: "50%", border: "1px solid rgba(48,39,32,.28)", background: "transparent", color: "var(--k-ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .35s ease,color .35s ease,opacity .35s ease" };
export const FRAME_INNER = (inset: number, a = 0.22): CSSProperties => ({ position: "absolute", inset, border: `1px solid rgba(176,142,82,${a})`, pointerEvents: "none" });

/** Text for screen readers only (the visual version is split into animated, aria-hidden pieces). */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span style={{ position: "absolute", width: 1, height: 1, margin: -1, padding: 0, overflow: "hidden", clip: "rect(0 0 0 0)", clipPath: "inset(50%)", whiteSpace: "nowrap", border: 0 }}>{children}</span>;
}
