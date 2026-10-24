/** Anything the ticker steps first each frame (Lenis). */
export type Steppable = { raf(time: number): void };

type Sub = { interval: number; last: number };
export type TickFn = (time: number, dt: number) => void;

/**
 * One requestAnimationFrame loop for the whole template (prototype `tick/untick/frame`).
 * Lenis is stepped first so every reader sees this frame's scroll position. A throwing callback is
 * dropped, not retried. Frame-rate caps are per subscriber (`interval` ms, 0 = every frame).
 */
export class Ticker {
  private subs = new Map<TickFn, Sub>();
  private rafId = 0;
  private lenis: Steppable | null = null;

  get size() {
    return this.subs.size;
  }
  get running() {
    return this.rafId !== 0;
  }

  tick(fn: TickFn, interval = 0) {
    this.subs.set(fn, { interval, last: -1 });
    this.kick();
  }
  untick(fn: TickFn) {
    this.subs.delete(fn);
  }
  setLenis(l: Steppable | null) {
    this.lenis = l;
    this.kick();
  }
  /** Re-time an existing subscriber (used when the cover degrades to 30 fps). */
  retime(fn: TickFn, interval: number, now: number) {
    this.subs.set(fn, { interval, last: now });
  }
  /** Stop the loop and drop every subscriber. */
  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.subs.clear();
    this.lenis = null;
  }

  private kick() {
    if (!this.rafId) this.rafId = requestAnimationFrame(this.frame);
  }

  private frame = (time: number) => {
    this.rafId = 0;
    if (this.lenis) {
      try {
        this.lenis.raf(time);
      } catch {
        /* a broken scroller must not stop the frame */
      }
    }
    for (const [fn, s] of [...this.subs]) {
      if (s.last >= 0 && time - s.last < s.interval) continue;
      const dt = s.last < 0 ? 16.7 : Math.min(64, time - s.last);
      s.last = time;
      try {
        fn(time, dt);
      } catch (e) {
        console.error(e);
        this.subs.delete(fn);
      }
    }
    if (this.subs.size || this.lenis) this.rafId = requestAnimationFrame(this.frame);
  };
}
