import type Lenis from "lenis";
import type { MotionLevel } from "../manifest";
import { readMotionPolicy, type MotionPolicy } from "./policy";
import { Ticker } from "./ticker";

export type EngineOptions = { themeLevel?: MotionLevel; durationScale?: number };

/**
 * Everything the template does outside React's render: the shared ticker, Lenis, timers, listeners,
 * scroll locks. Constructing it has NO side effects; `mount()` starts it and `unmount()` undoes every
 * effect of it, so React StrictMode's mount → unmount → mount cycle (and a real unmount) leaves
 * nothing behind: no rAF, no interval, no listener, no observer, no scroll lock, no Lenis.
 */
export class Engine {
  readonly ticker = new Ticker();
  lenis: Lenis | null = null;
  /** Pointer in -1..1 viewport space (written by the root's pointermove listener). */
  pointer = { x: 0, y: 0 };

  private timers = new Set<ReturnType<typeof setTimeout>>();
  private disposers: Array<() => void> = [];
  private locks = 0;
  private cached: MotionPolicy | null = null;
  private gen = 0;
  mounted = false;

  constructor(private readonly opts: EngineOptions = {}) {}

  /** The motion policy (docs/17 §7.3), read from matchMedia on first use per mount. */
  policy(): MotionPolicy {
    return (this.cached ??= readMotionPolicy(this.opts.themeLevel, this.opts.durationScale));
  }

  /** setTimeout that unmount cancels. */
  later(ms: number, fn: () => void) {
    const id = setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
    return id;
  }
  /** Cancel every pending `later` (the prototype does this when the opening finishes). */
  clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
  }

  /** Run `fn` on unmount (observers, WAAPI animations, WebGL layers...). */
  addDisposer(fn: () => void) {
    this.disposers.push(fn);
    return fn;
  }

  /** addEventListener that unmount removes. Returns the early remover. */
  listen<K extends keyof WindowEventMap>(target: Window, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions): () => void;
  listen<K extends keyof DocumentEventMap>(target: Document, type: K, fn: (e: DocumentEventMap[K]) => void, opts?: AddEventListenerOptions): () => void;
  listen(target: EventTarget, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions): () => void {
    target.addEventListener(type, fn as EventListener, opts);
    const off = () => target.removeEventListener(type, fn as EventListener, opts);
    this.disposers.push(off);
    return off;
  }

  /** Freeze page scroll (cover, lightbox). Counted: scroll returns when every lock is released. */
  lock() {
    this.locks++;
    this.applyLock();
  }
  unlock() {
    this.locks = Math.max(0, this.locks - 1);
    this.applyLock();
  }
  get locked() {
    return this.locks > 0;
  }
  private applyLock() {
    if (typeof document === "undefined") return;
    const v = this.locks > 0 ? "hidden" : "";
    document.documentElement.style.overflow = v;
    document.body.style.overflow = v;
    if (this.lenis) {
      if (this.locks > 0) this.lenis.stop();
      else this.lenis.start();
    }
  }

  mount() {
    if (this.mounted) return;
    this.mounted = true;
    this.cached = null;
    const gen = ++this.gen;
    if (this.policy().smoothScroll) void this.initLenis(gen);
  }

  private async initLenis(gen: number) {
    try {
      const mod = await import("lenis");
      if (gen !== this.gen) return; // unmounted (or remounted) while the chunk loaded
      const L = (mod.default ?? (mod as unknown as { Lenis: typeof Lenis }).Lenis) as typeof Lenis;
      const lenis = new L({ smoothWheel: true, anchors: true, autoRaf: false });
      if (this.locks > 0) lenis.stop();
      this.lenis = lenis;
      this.ticker.setLenis(lenis);
    } catch {
      this.lenis = null; // native scrolling still works
    }
  }

  unmount() {
    if (!this.mounted) return;
    this.mounted = false;
    this.gen++;
    this.clearTimers();
    for (const d of this.disposers.reverse()) {
      try {
        d();
      } catch (e) {
        console.error(e);
      }
    }
    this.disposers = [];
    this.ticker.destroy();
    if (this.lenis) {
      try {
        this.lenis.destroy();
      } catch {
        /* already gone */
      }
      this.lenis = null;
    }
    this.locks = 0;
    this.applyLock();
    this.cached = null;
  }
}
