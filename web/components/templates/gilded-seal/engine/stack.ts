import { clamp } from "@/lib/kit/motion/ease";
import type { Engine } from "@/lib/kit/motion/engine";

export type StackLayer = {
  el: HTMLElement;
  inner: HTMLElement;
  shade: HTMLElement;
  next: Element | null;
  /** Layer top offset (min(0, vh − height)) so a tall layer scrolls before it sticks. */
  top: number;
  /** 0..1: how far the next layer has slid over this one. −1 = not yet applied. */
  p: number;
};

export type Stack = {
  layers: StackLayer[];
  layout(): void;
  apply(vh: number, vw: number): void;
};

/**
 * The "album stack" (docs/15 §8.5): sticky layers, each shrinking and darkening as the next slides
 * over it. Layers are discovered from the DOM (`[data-stack-layer]`), so a hidden section simply
 * leaves the stack. Prototype `setupStack / layoutStack / applyStack`.
 */
export function createStack(root: HTMLElement, engine: Engine): Stack {
  const layers: StackLayer[] = [...root.querySelectorAll<HTMLElement>("[data-stack-layer]")].map((el) => ({
    el,
    inner: el.querySelector<HTMLElement>("[data-stack-inner]")!,
    shade: el.querySelector<HTMLElement>("[data-stack-shade]")!,
    next: el.nextElementSibling,
    top: 0,
    p: -1,
  }));

  const layout = () => {
    const vh = innerHeight;
    layers.forEach((L) => {
      const top = Math.min(0, vh - L.el.offsetHeight);
      L.top = top;
      L.el.style.top = top + "px";
      L.p = -1;
    });
  };

  const apply = (vh: number, vw: number) => {
    const ps = layers.map((L) => (L.next ? clamp(1 - L.next.getBoundingClientRect().top / vh) : 0));
    const shrink = vw < 640 ? 0 : 0.07;
    layers.forEach((L, i) => {
      const p = ps[i];
      if (Math.abs(p - L.p) < 0.0005) return;
      L.p = p;
      L.inner.style.transformOrigin = `50% ${Math.round(-L.top + vh / 2)}px`;
      L.inner.style.transform = p > 0 && shrink ? `scale(${(1 - shrink * p).toFixed(4)})` : "";
      L.shade.style.opacity = (0.55 * p).toFixed(3);
      L.inner.style.visibility = p >= 0.999 ? "hidden" : ""; // "" = inherit, so a hidden <main> stays hidden
    });
  };

  layout();
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(layout);
    layers.forEach((L) => ro.observe(L.el));
    engine.addDisposer(() => ro.disconnect());
  }
  return { layers, layout, apply };
}
