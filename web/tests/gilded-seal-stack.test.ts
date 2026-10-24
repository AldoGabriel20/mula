import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Engine } from "@/lib/kit/motion/engine";
import { createParallax } from "@/lib/kit/motion/parallax";
import { prepareReveals } from "@/lib/kit/motion/reveals";
import { createStack } from "@/components/templates/gilded-seal/engine/stack";

const rect = (top: number, height = 0) => ({ top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON() {} }) as DOMRect;

let io: { cb: IntersectionObserverCallback; observed: Element[]; disconnected: boolean };
let animations: Array<{ el: Element; kf: Keyframe[]; opts: KeyframeAnimationOptions; played: boolean; cancelled: boolean; paused: boolean; currentTime: number; onfinish: (() => void) | null; play(): void; pause(): void; cancel(): void; finish(): void }>;

beforeEach(() => {
  animations = [];
  io = { cb: () => {}, observed: [], disconnected: false };
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IntersectionObserverCallback) {
        io.cb = cb;
      }
      observe(el: Element) {
        io.observed.push(el);
      }
      unobserve(el: Element) {
        io.observed = io.observed.filter((x) => x !== el);
      }
      disconnect() {
        io.disconnected = true;
      }
    },
  );
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  Element.prototype.animate = function (this: Element, kf: Keyframe[] | PropertyIndexedKeyframes | null, opts?: number | KeyframeAnimationOptions) {
    const a = {
      el: this, kf: kf as Keyframe[], opts: opts as KeyframeAnimationOptions, played: false, cancelled: false, paused: false, currentTime: -1, onfinish: null as (() => void) | null,
      play() { this.played = true; },
      pause() { this.paused = true; },
      cancel() { this.cancelled = true; },
      finish() {},
    };
    animations.push(a);
    return a as unknown as Animation;
  };
  vi.stubGlobal("innerHeight", 800);
});
afterEach(() => {
  vi.unstubAllGlobals();
  // @ts-expect-error — test shim
  delete Element.prototype.animate;
  document.body.innerHTML = "";
});

const stackDom = (n: number) => {
  document.body.innerHTML = Array.from({ length: n }, (_, i) => `<div data-stack-layer id="L${i}"><div data-stack-inner></div><div data-stack-shade></div></div>`).join("") + '<div id="after"></div>';
  return document.body;
};

describe("album stack", () => {
  it("finds layers from the DOM, so a hidden section simply leaves the stack", () => {
    const e = new Engine();
    expect(createStack(stackDom(3), e).layers).toHaveLength(3);
    expect(createStack(stackDom(2), e).layers).toHaveLength(2);
  });

  it("scales the inner layer and darkens the shade as the next layer slides over (desktop)", () => {
    const body = stackDom(2);
    const [a, b] = [...body.querySelectorAll<HTMLElement>("[data-stack-layer]")];
    // layer 0's next sibling is layer 1: half-way up the viewport; layer 1's next is #after, far below
    b.getBoundingClientRect = () => rect(400);
    body.querySelector("#after")!.getBoundingClientRect = () => rect(800);
    const stack = createStack(body, new Engine());
    stack.apply(800, 1280);
    const inner = a.querySelector<HTMLElement>("[data-stack-inner]")!;
    const shade = a.querySelector<HTMLElement>("[data-stack-shade]")!;
    expect(stack.layers[0].p).toBeCloseTo(0.5, 5);
    expect(inner.style.transform).toBe("scale(0.9650)"); // 1 − .07 × .5
    expect(shade.style.opacity).toBe("0.275"); // .55 × .5
    expect(inner.style.visibility).toBe(""); // inherit
    expect(stack.layers[1].p).toBe(0);
  });

  it("does not shrink under 640px, and hides a fully covered layer", () => {
    const body = stackDom(2);
    const [a, b] = [...body.querySelectorAll<HTMLElement>("[data-stack-layer]")];
    b.getBoundingClientRect = () => rect(0); // fully slid over
    body.querySelector("#after")!.getBoundingClientRect = () => rect(800);
    const stack = createStack(body, new Engine());
    stack.apply(800, 390);
    const inner = a.querySelector<HTMLElement>("[data-stack-inner]")!;
    expect(inner.style.transform).toBe("");
    expect(a.querySelector<HTMLElement>("[data-stack-shade]")!.style.opacity).toBe("0.55");
    expect(inner.style.visibility).toBe("hidden");
  });

  it("layout sets each sticky top to min(0, vh − height) so a tall layer scrolls before it sticks", () => {
    const body = stackDom(2);
    const [a, b] = [...body.querySelectorAll<HTMLElement>("[data-stack-layer]")];
    Object.defineProperty(a, "offsetHeight", { value: 800 });
    Object.defineProperty(b, "offsetHeight", { value: 1500 });
    const stack = createStack(body, new Engine());
    expect(a.style.top).toBe("0px");
    expect(b.style.top).toBe("-700px");
    expect(stack.layers[1].top).toBe(-700);
  });
});

describe("parallax", () => {
  it("shifts an element by its parent's distance from the viewport centre × speed, only near the viewport", () => {
    document.body.innerHTML = '<div id="near"><i data-speed="-0.1"></i></div><div id="far"><i data-speed="0.5"></i></div>';
    document.getElementById("near")!.getBoundingClientRect = () => rect(500, 200); // centre 600, 200 below the viewport centre
    document.getElementById("far")!.getBoundingClientRect = () => rect(5000, 200);
    const p = createParallax(document.body);
    p.frame(800);
    const [near, far] = [...document.querySelectorAll<HTMLElement>("i")];
    expect(near.style.translate).toBe("0 -20.0px");
    expect(far.style.translate).toBe(""); // 4000px away: skipped
    expect(p.count).toBe(2);
  });
});

describe("scroll reveals", () => {
  const html = `
    <p data-reveal="up" data-delay="120"></p><p data-reveal="fade"></p><p data-reveal="map"></p><p data-reveal="char" data-delay="45"></p>
    <div data-reveal="mask"><div data-reveal-inner></div></div><p data-reveal="nonsense"></p>`;

  it("prepares a paused animation per kind at t = 0, with the prototype's keyframes and timings", () => {
    document.body.innerHTML = html;
    vi.stubGlobal("CSS", { supports: () => false });
    const r = prepareReveals(document.body, new Engine());
    expect(r.count).toBe(5); // unknown kinds are ignored
    const by = (k: string) => animations.find((a) => (a.el as HTMLElement).dataset.reveal === k)!;
    expect(by("up").kf).toEqual([{ opacity: 0, transform: "translateY(34px)" }, { opacity: 1, transform: "none" }]);
    expect(by("up").opts).toMatchObject({ duration: 1200, delay: 120, fill: "both" });
    expect(by("fade").opts).toMatchObject({ duration: 1400 });
    expect(by("map").kf[0]).toMatchObject({ transform: "perspective(900px) rotateX(58deg) translateY(40px) scale(.9)" });
    expect(by("char").opts).toMatchObject({ duration: 1100, delay: 45 });
    const mask = animations.filter((a) => (a.el as HTMLElement).dataset.reveal === "mask" || (a.el as HTMLElement).hasAttribute("data-reveal-inner"));
    expect(mask).toHaveLength(2); // the clip and the inner zoom
    expect(mask[1].opts).toMatchObject({ duration: 2200 });
    expect(animations.every((a) => a.paused && a.cancelled === false)).toBe(true);
  });

  it("does not watch anything until start(); then plays once when seen and stops watching", () => {
    document.body.innerHTML = html;
    const r = prepareReveals(document.body, new Engine());
    expect(io.observed).toHaveLength(0);
    r.start();
    expect(io.observed).toHaveLength(5);
    const up = document.querySelector('[data-reveal="up"]')!;
    io.cb([{ target: up, isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(animations.some((a) => a.played)).toBe(false);
    io.cb([{ target: up, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(animations.filter((a) => a.played)).toHaveLength(1);
    expect(io.observed).not.toContain(up);
  });

  it("a finished reveal cancels itself so no fill lingers; unmount cancels the rest", () => {
    document.body.innerHTML = '<p data-reveal="up"></p>';
    const e = new Engine();
    e.mount();
    prepareReveals(document.body, e);
    animations[0].onfinish?.();
    expect(animations[0].cancelled).toBe(true);
    animations[0].cancelled = false;
    e.unmount();
    expect(io.disconnected).toBe(true);
    expect(animations[0].cancelled).toBe(true);
  });
});
