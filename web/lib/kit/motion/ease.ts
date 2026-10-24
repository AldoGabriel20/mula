// Motion constants and easing, copied from the prototype (docs/15 §8).

/** CSS easings. */
export const EASE = { out: "cubic-bezier(.22,1,.36,1)", inOut: "cubic-bezier(.65,0,.35,1)", in: "cubic-bezier(.55,0,.75,.2)" } as const;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Deterministic pseudo-random in [0,1). */
export const hash = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

/** JS easings (t in 0..1). */
export const ease = {
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
};
