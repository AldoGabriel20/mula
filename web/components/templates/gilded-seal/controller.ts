import type { Ctl, Refs, FrameFn, FrameKey } from "./context";
import { EASE } from "@/lib/kit/motion/ease";
import type { Engine } from "@/lib/kit/motion/engine";
import { createParallax } from "@/lib/kit/motion/parallax";
import { prepareReveals } from "@/lib/kit/motion/reveals";
import { createStack } from "./engine/stack";
import type { FontRoles } from "@/lib/kit/tokens";
import { detectLowGL, preferLite } from "@/lib/kit/gl/detect";

/** Intro speed factor. The prototype's "brisk" (.62) stays a code constant for QA (docs/15 §1.2). */
export const INTRO_K = 1;

export type ControllerDeps = {
  engine: Engine;
  refs: Refs;
  ctl: Ctl;
  /** React state setters for the four flags that change markup. */
  set: { showVeil(v: boolean): void; showCover(v: boolean): void; coverFallback(v: boolean): void; opening(v: boolean): void; viewport(w: number, h: number): void };
  getViewport(): { w: number; h: number };
  /** The theme's font stacks (CSS `font-family` values); the cover waits for these faces. */
  getFonts(): FontRoles;
};

/** Faces the veil waits for before the cover is built (prototype `document.fonts.load` list). */
export const preloadFaces = (f: FontRoles) => [
  `300 120px ${f.display}`,
  `italic 400 120px ${f.display}`,
  `italic 500 120px ${f.display}`,
  `600 40px ${f.body}`,
  `500 40px ${f.body}`,
  `400 80px ${f.script}`,
];

/**
 * The template's lifecycle: veil → cover → opening → done, the per-frame world loop, input handlers
 * (prototype `componentDidMount`, `veilFrame`, `liftVeil`, `initCover`, `open`, `skip`, `finishOpen`,
 * `world`, `onPointer`, `onKey`, `onResize`). Plain closures over stable objects: React only sees
 * the four flag setters. Sections hook in through `ctl` (registerFrame, heroPlay, buildCover…).
 */
export function createController(x: ControllerDeps) {
  const { engine, refs: r, ctl } = x;
  /**
   * Take the static route (card cover, plain backgrounds, no WebGL context at all) on software GL,
   * data-saver / 2g, and under reduced motion: every GPU layer is either animated or pointless without
   * motion, and those guests should not download three.js for a still picture.
   */
  const lowGpu = () => !engine.policy().webgl || detectLowGL() || preferLite();

  // ---- registration (sections call these from their effects) ----
  const registerFrame = (key: FrameKey, fn: FrameFn) => {
    ctl.frames[key] = fn;
    return () => {
      if (ctl.frames[key] === fn) delete ctl.frames[key];
    };
  };
  const onGl = (fn: (low: boolean) => void) => {
    if (ctl.lowGL !== undefined) {
      fn(ctl.lowGL);
      return () => {};
    }
    ctl.glSubs.add(fn);
    return () => ctl.glSubs.delete(fn);
  };

  // ---- loading veil ----
  const veilFrame = (_time: number, dt: number) => {
    const s = ctl.veilSpr;
    if (ctl.loadDone) s.set({ tension: 170, friction: 26 });
    s.target = ctl.loadDone ? 1 : Math.min(0.9, ctl.loadProgress + 0.08);
    const v = engine.policy().reduced && ctl.loadDone ? 1 : s.step(dt);
    const f = r.veilFill.current;
    const b = r.veilBar.current;
    if (f) f.style.clipPath = `inset(${((1 - v) * 100).toFixed(2)}% 0 0 0)`;
    if (b) b.style.transform = `scaleX(${v.toFixed(4)})`;
    if (ctl.loadDone && v > 0.985) liftVeil();
  };

  const liftVeil = () => {
    if (ctl.veilLifted) return;
    ctl.veilLifted = true;
    engine.ticker.untick(veilFrame);
    const v = r.veil.current;
    const m = r.veilMark.current;
    const { reduced } = engine.policy();
    const done = () => x.set.showVeil(false);
    ctl.coverRiseStart = performance.now() + (reduced ? 0 : 300);
    if (reduced || !v) {
      done();
      return;
    }
    if (m) m.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-26px) scale(.96)" }], { duration: 700, easing: EASE.inOut, fill: "forwards" });
    const a = v.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }], { duration: 1150, delay: 280, easing: EASE.inOut, fill: "forwards" });
    a.onfinish = done;
    [r.coverHead, r.coverFoot].forEach((ref, i) => {
      if (ref.current) ref.current.animate([{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "none" }], { duration: 1400, delay: 1000 + i * 220, easing: EASE.out, fill: "backwards" });
    });
  };

  // ---- cover loading ----
  let costs: number[] = [];
  let degraded: boolean | "ok" = false;

  const coverFrame = (time: number, dt: number) => {
    const c = ctl.cover3d;
    if (!c) return;
    const t0 = performance.now();
    c.update(time, dt);
    const cost = performance.now() - t0;
    // watchdog: if early frames are slow, drop to a lighter render path
    if (!degraded) {
      costs.push(Math.max(cost, dt));
      if (costs.length >= 20) {
        const s = [...costs].sort((a, b) => a - b);
        if (s[10] > 50) {
          degraded = true;
          c.degrade();
          engine.ticker.retime(coverFrame, 33, time);
        } else degraded = "ok";
      }
    }
  };

  const fallbackCover = () => {
    ctl.loadDone = true;
    x.set.coverFallback(true);
  };

  /** Fonts → GPU class → three.js → scene. Any failure lands on the static cover card. */
  const startCover = async (alive: () => boolean) => {
    const step = (n: number) => {
      ctl.loadProgress = Math.min(1, ctl.loadProgress + n);
    };
    const fonts = Promise.race([
      Promise.all(preloadFaces(x.getFonts()).map((f) => document.fonts?.load(f))),
      new Promise((res) => setTimeout(res, 4000)),
    ])
      .catch(() => {})
      .then(() => step(0.3));
    if (ctl.lowGL === undefined) ctl.lowGL = lowGpu();
    if (ctl.lowGL || !ctl.buildCover) {
      await fonts;
      if (alive()) fallbackCover();
      return;
    }
    let THREE: typeof import("three") | null = null;
    try {
      THREE = await import("three");
      step(0.3);
    } catch (e) {
      console.warn("three.js unavailable", e);
    }
    await fonts;
    if (!alive()) return;
    if (!THREE) return fallbackCover();
    try {
      ctl.cover3d = ctl.buildCover(THREE);
      ctl.cover3d.update(performance.now(), 16);
      step(0.3);
      const { reduced, fine } = engine.policy();
      engine.ticker.tick(coverFrame, reduced ? 120 : fine ? 0 : 33);
    } catch (e) {
      console.warn("cover scene failed", e);
      ctl.cover3d = null;
      x.set.coverFallback(true);
    }
    ctl.loadDone = true;
  };

  // ---- opening ----
  const playHero = (delay: number) => ctl.heroPlay?.(delay);

  const open = () => {
    if (ctl.phase !== "idle" || !ctl.veilLifted) return;
    ctl.phase = "opening";
    x.set.opening(true);
    ctl.playMusic?.(); // inside the guest's click: satisfies autoplay rules
    const k = INTRO_K;
    ctl.openK = k;
    const A = (el: Element | null, kf: Keyframe[], o: KeyframeAnimationOptions & { duration: number }) => {
      if (!el) return;
      ctl.seq.push(el.animate(kf, { fill: "forwards", easing: EASE.out, ...o, duration: o.duration * k, delay: ((o.delay as number) || 0) * k }));
    };
    const { reduced } = engine.policy();
    if (reduced || !ctl.cover3d) {
      A(r.cover.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: "linear" });
      playHero(200 * k);
      engine.later(650 * k, finishOpen);
      return;
    }
    ctl.openT0 = performance.now();
    A(r.coverHead.current, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-18px)" }], { duration: 700 });
    A(r.coverFoot.current, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(18px)" }], { duration: 700 });
    r.cover.current?.querySelectorAll<HTMLElement>("[data-cover-fg]").forEach((el) => {
      const side = +(el.dataset.coverFg || 0);
      A(el, [{ transform: "none", opacity: 0.85 }, { transform: `translate(${-side * 14}vw, ${side * 12}vh) scale(1.6)`, opacity: 0 }], { duration: 1900, easing: EASE.inOut });
    });
    A(r.shaft.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 1400, delay: 600 });
    A(r.cover.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 3600, easing: "linear" });
    playHero(3450 * k);
    engine.later(4250 * k, finishOpen);
  };

  const skip = () => {
    if (ctl.openT0) ctl.openT0 = -1e9;
    ctl.seq.forEach((a) => {
      try {
        a.finish();
      } catch {
        /* already finished */
      }
    });
    ctl.heroAnims.forEach((a) => {
      try {
        a.finish();
      } catch {
        /* already finished */
      }
    });
    ctl.burnStart = -1e9;
    ctl.petalsOn = true;
    finishOpen();
  };

  const finishOpen = () => {
    if (ctl.phase === "done") return;
    ctl.phase = "done";
    engine.clearTimers();
    engine.ticker.untick(coverFrame);
    if (ctl.cover3d) {
      try {
        ctl.cover3d.dispose();
      } catch {
        /* context already lost */
      }
      ctl.cover3d = null;
    }
    engine.unlock();
    if (r.main.current) r.main.current.inert = false;
    x.set.showCover(false);
    x.set.opening(false);
    window.scrollTo(0, 0);
    if (engine.lenis) {
      engine.lenis.start();
      engine.lenis.scrollTo(0, { immediate: true });
    }
    ctl.reveals?.start();
    if (!engine.policy().reduced) {
      r.scrollDot.current?.animate([{ transform: "translateY(-14px)", opacity: 0 }, { opacity: 1, offset: 0.3 }, { transform: "translateY(46px)", opacity: 0 }], { duration: 2200, iterations: Infinity, easing: EASE.inOut, delay: 600 });
      r.pinPulse.current?.animate([{ transform: "scale(.4)", opacity: 0.9 }, { transform: "scale(1.6)", opacity: 0 }], { duration: 2400, iterations: Infinity, easing: "ease-out" });
    }
    ctl.stack?.layout();
    r.heading.current?.focus({ preventScroll: true });
  };

  // ---- per-frame world ----
  let gbT = 0;
  const world = (time: number, dt: number) => {
    const vw = innerWidth;
    const vh = innerHeight;
    const f = ctl.frames;
    ctl.stack?.apply(vh, vw);
    const first = ctl.stack?.layers[0];
    const heroLive = ctl.phase !== "idle" && (!first || first.p < 1);
    if (heroLive) f.hero?.(time, dt, vw, vh);
    if (ctl.vis.statement) f.statement?.(time, dt, vw, vh);
    if (ctl.vis.date) f.date?.(time, dt, vw, vh);
    if (ctl.vis.gallery) f.gallery?.(time, dt, vw, vh);
    if (ctl.vis.closing) f.closing?.(time, dt, vw, vh);
    if (ctl.phase === "done" && !engine.policy().reduced) ctl.parallax?.frame(vh, engine.policy().parallaxScale);
    if (ctl.phase === "done" && time - gbT > 900) {
      gbT = time;
      f.galleryButtons?.(time, dt, vw, vh);
    }
  };

  // ---- input ----
  const onPointer = (e: PointerEvent) => {
    engine.pointer.x = (e.clientX / innerWidth) * 2 - 1;
    engine.pointer.y = (e.clientY / innerHeight) * 2 - 1;
    if (ctl.cover3d && ctl.phase === "idle" && engine.policy().fine) ctl.cover3d.hover(e.clientX, e.clientY);
  };
  const onKey = (e: KeyboardEvent) => {
    if (ctl.lightboxKey?.(e)) return;
    if (ctl.phase === "opening" && e.key === "Escape") skip();
  };
  let resizeRaf = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      const w = innerWidth;
      const h = innerHeight;
      const vp = x.getViewport();
      if (!engine.policy().fine && w === vp.w && Math.abs(h - vp.h) < 140) return; // mobile URL bar
      x.set.viewport(w, h);
      ctl.onResize.forEach((fn) => fn());
      ctl.cover3d?.resize();
    });
  };

  // ---- mount ----
  /** Everything the prototype's componentDidMount does. Idempotent per mount cycle (StrictMode). */
  const mount = () => {
    const root = r.root.current;
    if (!root) return;
    const { reduced } = engine.policy();
    // lifecycle state restarts; registrations made by section effects (frames, hooks, glSubs) stay
    Object.assign(ctl, { phase: "idle", loadProgress: 0, loadDone: false, veilLifted: false, coverRiseStart: null, openT0: 0, seq: [], heroAnims: [], burnStart: null, petalsOn: false, vis: {}, lowGL: undefined, cover3d: null });
    ctl.veilSpr.v = 0;
    ctl.veilSpr.vel = 0;
    ctl.veilSpr.target = 0;
    ctl.veilSpr.set({ tension: 10, friction: 30 });
    costs = [];
    degraded = false;
    gbT = 0;
    let alive = true;
    const isAlive = () => alive;
    engine.addDisposer(() => {
      alive = false;
      cancelAnimationFrame(resizeRaf);
    });

    try {
      history.scrollRestoration = "manual";
    } catch {
      /* not available */
    }
    window.scrollTo(0, 0);
    engine.lock();
    if (r.main.current) r.main.current.inert = true;

    ctl.stack = createStack(root, engine);
    ctl.parallax = createParallax(root);
    if (!reduced) ctl.reveals = prepareReveals(root, engine);
    else {
      ctl.reveals = null;
      ctl.flattenGallery?.();
    }

    const visIO = new IntersectionObserver((es) => es.forEach((e) => (ctl.vis[(e.target as HTMLElement).dataset.vis!] = e.isIntersecting)), { rootMargin: "15% 0px 15% 0px" });
    root.querySelectorAll("[data-vis]").forEach((el) => visIO.observe(el));
    engine.addDisposer(() => visIO.disconnect());

    engine.ticker.tick(veilFrame);
    engine.ticker.tick(world);

    // let the veil paint before any GPU work begins
    const idle = (cb: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(cb, { timeout: 400 }) : setTimeout(cb, 60));
    engine.later(30, () =>
      idle(() => {
        if (!alive) return;
        ctl.lowGL = lowGpu();
        ctl.glSubs.forEach((fn) => fn(ctl.lowGL as boolean));
        ctl.glSubs.clear();
        void startCover(isAlive);
      }),
    );

    engine.listen(window, "pointermove", onPointer, { passive: true });
    engine.listen(window, "keydown", onKey);
    engine.listen(window, "resize", onResize);
    engine.later(10000, () => {
      if (!ctl.loadDone) {
        ctl.loadDone = true;
        if (!ctl.cover3d) x.set.coverFallback(true);
      }
    });
  };

  return { mount, open, skip, finishOpen, registerFrame, onGl, veilFrame, world };
}

export type Controller = ReturnType<typeof createController>;
