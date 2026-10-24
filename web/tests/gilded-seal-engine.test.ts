import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Engine } from "@/lib/kit/motion/engine";
import { EASE, clamp, ease, hash, lerp } from "@/lib/kit/motion/ease";
import { Spring, spring } from "@/lib/kit/motion/spring";
import { Ticker } from "@/lib/kit/motion/ticker";

// Deterministic rAF: callbacks only run when flushed, at the time we choose.
let queue: Map<number, FrameRequestCallback>;
let nextId: number;
const flush = (time: number) => {
  const cbs = [...queue.values()];
  queue.clear();
  cbs.forEach((cb) => cb(time));
};

beforeEach(() => {
  queue = new Map();
  nextId = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    queue.set(++nextId, cb);
    return nextId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => queue.delete(id));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("spring()", () => {
  it("bakes a 49-stop CSS linear() easing from 0 to 1", () => {
    vi.stubGlobal("CSS", { supports: () => true });
    const e = spring(120, 18);
    expect(e.startsWith("linear(0,")).toBe(true);
    expect(e.endsWith(",1)")).toBe(true);
    expect(e.slice(7, -1).split(",")).toHaveLength(49);
  });
  it("falls back to the out curve where linear() is unsupported or CSS.supports throws", () => {
    vi.stubGlobal("CSS", { supports: () => false });
    expect(spring()).toBe(EASE.out);
    vi.stubGlobal("CSS", { supports: () => { throw new Error("no"); } });
    expect(spring()).toBe(EASE.out);
  });
  it("overshoots with low damping and settles at 1", () => {
    vi.stubGlobal("CSS", { supports: () => true });
    const stops = spring(95, 15).slice(7, -1).split(",").map(Number);
    expect(Math.max(...stops)).toBeGreaterThan(1);
    expect(stops.at(-1)).toBe(1);
  });
});

describe("Spring", () => {
  it("moves toward its target and comes to rest", () => {
    const s = new Spring(0, { tension: 120, friction: 18 });
    s.target = 1;
    expect(s.rest).toBe(false);
    for (let i = 0; i < 200; i++) s.step(16);
    expect(s.v).toBeCloseTo(1, 2);
    expect(s.rest).toBe(true);
  });
  it("caps one step at 64 sub-steps so a long frame cannot explode", () => {
    const s = new Spring(0);
    s.target = 1;
    const v = s.step(10_000);
    expect(Number.isFinite(v)).toBe(true);
    expect(Math.abs(v)).toBeLessThan(2);
  });
});

describe("ease helpers", () => {
  it("hit their endpoints and stay in range", () => {
    for (const f of Object.values(ease)) {
      expect(f(0)).toBeCloseTo(0, 10);
      expect(f(1)).toBeCloseTo(1, 10);
    }
    expect(clamp(5)).toBe(1);
    expect(clamp(-1)).toBe(0);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(hash(3)).toBe(hash(3));
    expect(hash(3)).toBeGreaterThanOrEqual(0);
    expect(hash(3)).toBeLessThan(1);
  });
});

describe("Ticker", () => {
  it("runs subscribers each frame with a clamped dt, and stops when idle", () => {
    const t = new Ticker();
    const seen: number[] = [];
    const fn = (_: number, dt: number) => seen.push(dt);
    t.tick(fn);
    flush(1000); // first call: nominal 16.7
    flush(1016);
    flush(2000); // a long gap is clamped to 64
    expect(seen).toEqual([16.7, 16, 64]);
    t.untick(fn);
    flush(2016);
    expect(queue.size).toBe(0); // no subscribers, no Lenis → the loop ended
    expect(t.running).toBe(false);
  });
  it("honours per-subscriber intervals", () => {
    const t = new Ticker();
    const fast = vi.fn();
    const slow = vi.fn();
    t.tick(fast);
    t.tick(slow, 100);
    for (let time = 0; time <= 300; time += 50) flush(time);
    expect(fast).toHaveBeenCalledTimes(7);
    expect(slow.mock.calls.map((c) => c[0])).toEqual([0, 100, 200, 300]);
  });
  it("steps Lenis first, and keeps looping while Lenis exists", () => {
    const t = new Ticker();
    const order: string[] = [];
    t.setLenis({ raf: () => order.push("lenis") });
    t.tick(() => order.push("sub"));
    flush(0);
    expect(order).toEqual(["lenis", "sub"]);
    t.untick([...(t as unknown as { subs: Map<never, unknown> }).subs.keys()][0] as never);
    flush(16);
    expect(queue.size).toBe(1); // still scheduled for Lenis
  });
  it("drops a throwing subscriber instead of retrying it every frame", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const t = new Ticker();
    const bad = vi.fn(() => {
      throw new Error("boom");
    });
    const good = vi.fn();
    t.tick(bad);
    t.tick(good);
    flush(0);
    flush(16);
    expect(bad).toHaveBeenCalledTimes(1);
    expect(good).toHaveBeenCalledTimes(2);
    err.mockRestore();
  });
  it("retime changes a subscriber's interval; destroy cancels the frame and clears everything", () => {
    const t = new Ticker();
    const fn = vi.fn();
    t.tick(fn);
    t.retime(fn, 33, 0);
    flush(10);
    expect(fn).not.toHaveBeenCalled();
    t.destroy();
    expect(queue.size).toBe(0);
    expect(t.size).toBe(0);
  });
});

describe("Engine lifecycle", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("hover") ? true : false }));
  });

  it("reads reduced-motion and pointer capability lazily and once per mount", () => {
    const mm = vi.fn((q: string) => ({ matches: q.includes("reduce") }));
    vi.stubGlobal("matchMedia", mm);
    const e = new Engine();
    expect(mm).not.toHaveBeenCalled(); // constructing has no side effects
    const p = e.policy();
    expect(p).toMatchObject({ reduced: true, fine: false, level: "off", webgl: false, smoothScroll: false });
    e.policy();
    expect(mm).toHaveBeenCalledTimes(2);
  });

  it("scroll locks are counted: scroll returns only when every lock is released", () => {
    const e = new Engine();
    e.lock();
    e.lock();
    expect(document.documentElement.style.overflow).toBe("hidden");
    e.unlock();
    expect(document.documentElement.style.overflow).toBe("hidden");
    e.unlock();
    expect(document.documentElement.style.overflow).toBe("");
    e.unlock(); // never goes negative
    expect(e.locked).toBe(false);
  });

  it("unmount undoes everything: timers, listeners, disposers, ticker, locks; and it can mount again", () => {
    vi.useFakeTimers();
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const e = new Engine();
    const timer = vi.fn();
    const dispose = vi.fn();
    const onKey = vi.fn();
    const run = () => {
      e.mount();
      e.later(1000, timer);
      e.addDisposer(dispose);
      e.listen(window, "keydown", onKey);
      e.ticker.tick(() => {});
      e.lock();
    };
    run();
    e.unmount();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls.filter((c) => c[0] === "keydown")).toHaveLength(1);
    expect(add.mock.calls.filter((c) => c[0] === "keydown")).toHaveLength(1);
    expect(queue.size).toBe(0);
    expect(e.ticker.size).toBe(0);
    expect(document.documentElement.style.overflow).toBe("");
    vi.advanceTimersByTime(5000);
    expect(timer).not.toHaveBeenCalled(); // cancelled

    // StrictMode: the same instance mounts again and works
    run();
    window.dispatchEvent(new KeyboardEvent("keydown"));
    expect(onKey).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(timer).toHaveBeenCalledTimes(1);
    e.unmount();
    add.mockRestore();
    remove.mockRestore();
  });

  it("unmount is idempotent and clearTimers cancels only timers", () => {
    vi.useFakeTimers();
    const e = new Engine();
    const t = vi.fn();
    const d = vi.fn();
    e.mount();
    e.later(10, t);
    e.addDisposer(d);
    e.clearTimers();
    vi.advanceTimersByTime(100);
    expect(t).not.toHaveBeenCalled();
    expect(d).not.toHaveBeenCalled();
    e.unmount();
    e.unmount();
    expect(d).toHaveBeenCalledTimes(1);
  });

  it("a Lenis chunk that arrives after unmount is ignored (no scroller, no ticker loop)", async () => {
    const created = vi.fn();
    vi.doMock("lenis", () => ({ default: class { constructor() { created(); } stop() {} start() {} destroy() {} raf() {} } }));
    const e = new Engine();
    e.mount();
    e.unmount(); // before the dynamic import resolves
    await new Promise((r) => setTimeout(r, 20));
    expect(created).not.toHaveBeenCalled();
    expect(e.lenis).toBeNull();
    vi.doUnmock("lenis");
  });
});
