import type { MotionLevel } from "../manifest";

/** The device's and the host's answers about motion, merged (docs/17 §7.3). */
export type MotionPolicy = {
  /** Effective level: reduced motion forces "off"; otherwise the theme's. */
  level: MotionLevel;
  /** `prefers-reduced-motion: reduce`. Templates that cannot animate gently show their static path. */
  reduced: boolean;
  /** A mouse-like pointer (hover + fine): pointer-driven effects only run here. */
  fine: boolean;
  /** Multiplier for durations (calm 1.4). */
  durationScale: number;
  /** Multiplier for parallax amplitude (calm .5, off 0). */
  parallaxScale: number;
  /** WebGL enhancement allowed by policy (the device may still lack it: see gl/detect). */
  webgl: boolean;
  /** Smooth (Lenis) scrolling. */
  smoothScroll: boolean;
};

export type PolicyInput = { reducedMotion: boolean; fine: boolean; themeLevel?: MotionLevel; durationScale?: number };

/** Pure: the table of docs/17 §7.3. Reduced motion always wins over the host's choice. */
export function resolveMotionPolicy({ reducedMotion, fine, themeLevel = "full", durationScale = 1 }: PolicyInput): MotionPolicy {
  const level: MotionLevel = reducedMotion ? "off" : themeLevel;
  return {
    level,
    reduced: reducedMotion,
    fine,
    durationScale: level === "calm" ? durationScale * 1.4 : durationScale,
    parallaxScale: level === "full" ? 1 : level === "calm" ? 0.5 : 0,
    webgl: level === "full",
    smoothScroll: level !== "off",
  };
}

/** Reads `matchMedia` (no matchMedia, e.g. a server or a bare test env, counts as reduced). */
export function readMotionPolicy(themeLevel?: MotionLevel, durationScale?: number): MotionPolicy {
  const has = typeof matchMedia === "function";
  return resolveMotionPolicy({
    reducedMotion: has ? matchMedia("(prefers-reduced-motion: reduce)").matches : true,
    fine: has ? matchMedia("(hover: hover) and (pointer: fine)").matches : false,
    themeLevel,
    durationScale,
  });
}
