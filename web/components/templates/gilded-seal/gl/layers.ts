import type { Uniforms } from "@/lib/kit/gl/layer";
import type { ResolvedTheme } from "@/lib/kit/tokens";

/** The contour/burn uniforms per layer (docs/15 §8.14). */
export const LAYERS = {
  hero: { uTime: 0, uPointer: [0, 0], uBase: [0.961, 0.933, 0.89], uLine: [0.69, 0.55, 0.33], uAlpha: 0.17, uGlow: [1, 0.985, 0.95], uGlowAmt: 0.6, uScale: 3.4, uVig: 0.1 },
  date: { uTime: 0, uPointer: [0, 0], uBase: [0.18, 0.145, 0.12], uLine: [0.91, 0.84, 0.68], uAlpha: 0.09, uGlow: [0.55, 0.42, 0.25], uGlowAmt: 0.45, uScale: 3, uVig: 0.35 },
  closing: { uTime: 0, uPointer: [0, 0], uBase: [0.953, 0.918, 0.875], uLine: [0.7, 0.52, 0.49], uAlpha: 0.2, uGlow: [1, 0.97, 0.94], uGlowAmt: 0.5, uScale: 3.2, uVig: 0.1 },
  burn: { uP: 0, uPaper: [0.961, 0.933, 0.89], uGold: [0.88, 0.72, 0.42] },
} satisfies Record<string, Uniforms>;
/** Backing-store scale per layer (hero .7, date/closing .6, burn 1). */
export const LAYER_DPR = { hero: 0.7, date: 0.6, closing: 0.6, burn: 1 } as const;

const DEFAULT_LINE = "#B08E52";
const DEFAULT_SOFT = "#E8D7AD";
const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => +(parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3)) as [number, number, number];

/**
 * The layer uniforms for the resolved theme. With the template's own colours this is `LAYERS` itself
 * (the prototype's numbers, pixel-neutral); a theme that changes the gold line or its soft tint re-colours
 * the contour lines of hero/closing and date. Shader backdrops (`uBase`, `uGlow`) stay the prototype's.
 */
export function themedLayers(colors: ResolvedTheme["colors"]): typeof LAYERS {
  if (colors.line === DEFAULT_LINE && colors.accentSoft === DEFAULT_SOFT) return LAYERS;
  return {
    ...LAYERS,
    hero: { ...LAYERS.hero, uLine: rgb(colors.line) },
    closing: { ...LAYERS.closing, uLine: rgb(colors.line) },
    date: { ...LAYERS.date, uLine: rgb(colors.accentSoft) },
  };
}
