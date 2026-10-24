import { EASE } from "./ease";

/** react-spring style damped spring, 1 ms sub-steps, mass 1 (prototype `Component.Spring`). */
export class Spring {
  v: number;
  vel = 0;
  target: number;
  k = 170;
  c = 26;
  constructor(v = 0, cfg: { tension?: number; friction?: number } = {}) {
    this.v = v;
    this.target = v;
    this.set(cfg);
  }
  set({ tension = 170, friction = 26 }: { tension?: number; friction?: number } = {}) {
    this.k = tension;
    this.c = friction;
    return this;
  }
  /** Advance by dt ms (at most 64 sub-steps per call). */
  step(dt: number) {
    let n = Math.min(64, dt) | 0;
    while (n-- > 0) {
      this.vel += (-this.k * (this.v - this.target) - this.c * this.vel) * 0.001;
      this.v += this.vel * 0.001;
    }
    return this.v;
  }
  get rest() {
    return Math.abs(this.vel) < 0.01 && Math.abs(this.target - this.v) < 0.001;
  }
}

/**
 * The same spring baked into a CSS `linear()` easing for one-shot compositor animations: 49 stops
 * (N = 48). Falls back to the `out` curve where `linear()` is unsupported.
 */
export function spring(stiffness = 120, damping = 16): string {
  let x = 0;
  let v = 0;
  let t = 0;
  const dt = 1 / 120;
  const pts: number[] = [];
  while (t < 4) {
    v += (-stiffness * (x - 1) - damping * v) * dt;
    x += v * dt;
    t += dt;
    pts.push(x);
    if (t > 0.3 && Math.abs(x - 1) < 0.0008 && Math.abs(v) < 0.002) break;
  }
  const N = 48;
  const out = [0];
  for (let i = 1; i < N; i++) out.push(+pts[Math.round((i / N) * (pts.length - 1))].toFixed(4));
  out.push(1);
  const e = `linear(${out.join(",")})`;
  try {
    return CSS.supports("animation-timing-function", e) ? e : EASE.out;
  } catch {
    return EASE.out;
  }
}
