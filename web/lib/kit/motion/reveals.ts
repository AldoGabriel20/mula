import { EASE } from "./ease";
import type { Engine } from "./engine";
import { spring } from "./spring";

export type RevealKind = "up" | "char" | "fade" | "map" | "mask" | "draw";

export type Reveals = {
  /** Begin watching: call once the cover has opened. */
  start(): void;
  /** Elements prepared (one entry per `[data-reveal]`). */
  readonly count: number;
};

/**
 * Scroll reveals (docs/15 §8.13). Every `[data-reveal]` gets a paused WAAPI animation at t = 0 (so it
 * is invisible before it is seen), played once when it enters the viewport, then cancelled so no
 * fill lingers. `data-delay` is added to the animation delay. No-op under reduced motion: callers
 * simply do not create it.
 */
export function prepareReveals(root: HTMLElement, engine: Engine): Reveals {
  const sp = spring(120, 18);
  const map = new Map<Element, Animation[]>();
  const k = engine.policy().durationScale; // 1 unless the host chose "calm" (×1.4)
  const make = (el: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => {
    const a = el.animate(kf, { fill: "both", easing: EASE.out, ...o, duration: (o.duration as number) * k, delay: (o.delay as number | undefined) === undefined ? undefined : (o.delay as number) * k });
    a.pause();
    a.currentTime = 0;
    a.onfinish = () => a.cancel();
    return a;
  };

  root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    const kind = el.dataset.reveal as RevealKind;
    const delay = +(el.dataset.delay || 0);
    const list: Animation[] = [];
    if (kind === "up") list.push(make(el, [{ opacity: 0, transform: "translateY(34px)" }, { opacity: 1, transform: "none" }], { duration: 1200, delay }));
    else if (kind === "char") list.push(make(el, [{ opacity: 0, transform: "translateY(.3em)" }, { opacity: 1, transform: "none" }], { duration: 1100, delay, easing: sp }));
    else if (kind === "fade") list.push(make(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 1400, delay }));
    else if (kind === "map")
      list.push(make(el, [{ opacity: 0, transform: "perspective(900px) rotateX(58deg) translateY(40px) scale(.9)" }, { opacity: 1, transform: "perspective(900px) rotateX(0deg)" }], { duration: 1800, delay, easing: EASE.out }));
    else if (kind === "mask") {
      list.push(make(el, [{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)" }], { duration: 1500, delay, easing: EASE.inOut }));
      const inner = el.querySelector("[data-reveal-inner]");
      if (inner) list.push(make(inner, [{ transform: "scale(1.22)" }, { transform: "none" }], { duration: 2200, delay }));
    } else if (kind === "draw" && typeof (el as Partial<SVGGeometryElement>).getTotalLength === "function") {
      const path = el as unknown as SVGGeometryElement;
      const len = Math.ceil(path.getTotalLength());
      path.style.strokeDasharray = `${len} ${len}`;
      list.push(make(el, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1600, delay: delay + 200, easing: EASE.inOut }));
    }
    if (list.length) map.set(el, list);
  });

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        (map.get(e.target) ?? []).forEach((a) => a.play());
        io.unobserve(e.target);
      }),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );
  engine.addDisposer(() => {
    io.disconnect();
    map.forEach((list) => list.forEach((a) => a.cancel()));
    map.clear();
  });

  return {
    start: () => map.forEach((_, el) => io.observe(el)),
    get count() {
      return map.size;
    },
  };
}
