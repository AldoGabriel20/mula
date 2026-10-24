import { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Invite } from "@/lib/api/invite";

// next/font is a compiler transform: stand in for it so the template's font module can load here
vi.mock("next/font/local", () => ({ default: (o: { variable: string }) => ({ variable: o.variable, style: { fontFamily: o.variable } }) }));
const lenis = { created: 0, destroyed: 0 };
vi.mock("lenis", () => ({
  default: class {
    constructor() { lenis.created++; }
    stop() {} start() {} raf() {} scrollTo() {}
    destroy() { lenis.destroyed++; }
  },
}));

import GildedSeal from "./helpers/gilded-seal";

let rafQueue: Map<number, FrameRequestCallback>;
let rafId: number;
const listeners = new Map<string, number>();
/** Run the frames that are queued NOW (new ones scheduled by those frames wait for the next call). */
const frame = (time: number) => {
  const cbs = [...rafQueue.values()];
  rafQueue.clear();
  cbs.forEach((cb) => cb(time));
};
/** Let fonts and the GPU probe finish, then run the veil spring to completion (it lifts at 98.5 %). */
const finishLoading = async () => {
  await vi.advanceTimersByTimeAsync(200);
  for (let t = 0; t < 120; t++) {
    frame(t * 50);
    await vi.advanceTimersByTimeAsync(50);
  }
};

beforeEach(() => {
  vi.useFakeTimers();
  rafQueue = new Map();
  rafId = 0;
  lenis.created = lenis.destroyed = 0;
  listeners.clear();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (rafQueue.set(++rafId, cb), rafId));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => rafQueue.delete(id));
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("hover") || q.includes("pointer"), addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null); // no GPU in jsdom → the static cover card
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  window.scrollTo = vi.fn() as typeof window.scrollTo;
  Element.prototype.animate = vi.fn(() => ({ pause() {}, play() {}, cancel() {}, finish() {}, set currentTime(_v: number) {}, onfinish: null })) as unknown as typeof Element.prototype.animate;
  const add = window.addEventListener.bind(window);
  const remove = window.removeEventListener.bind(window);
  vi.spyOn(window, "addEventListener").mockImplementation(((t: string, fn: EventListener, o?: unknown) => (listeners.set(t, (listeners.get(t) ?? 0) + 1), add(t, fn, o as boolean))) as typeof window.addEventListener);
  vi.spyOn(window, "removeEventListener").mockImplementation(((t: string, fn: EventListener, o?: unknown) => (listeners.set(t, (listeners.get(t) ?? 0) - 1), remove(t, fn, o as boolean))) as typeof window.removeEventListener);
});
afterEach(() => {
  cleanup(); // unmount while the stubs are still in place
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  // @ts-expect-error — test shim
  delete Element.prototype.animate;
});

const invite: Invite = {
  template: "gilded-seal", timezone: "Asia/Jakarta", event_type: "wedding", couple_a: "Adrian", couple_b: "Isabella", event_date: "2027-06-12T03:00:00Z", venue: "Hall",
  palette: "Ivory", language: "en",
  sections: [{ type: "hero", content: {} }, { type: "opening", content: {} }, { type: "story", content: { body: "How we met" } }, { type: "rsvp", content: {} }, { type: "wishes", content: {} }, { type: "closing", content: {} }],
  schedule: [], media: {}, preview: false, gifts: [], gift_methods: [], live: null, rsvp_deadline: null, guest: { name: "Sarah", rsvp_status: "pending", party_size: 0, max_party: 3 },
};

describe("<GildedSeal>", () => {
  it("renders the page in the prototype's order, under a veil and a cover, with the main content inert", () => {
    const { container } = render(<GildedSeal mode="live" invite={invite} token="t" />);
    const root = container.querySelector('[data-template="gilded-seal"]')!;
    expect(root).toBeTruthy();
    expect(root.querySelector('[role="status"]')).toBeTruthy(); // veil
    expect(root.querySelector('[role="dialog"]')).toBeTruthy(); // cover
    const main = root.querySelector("main#invitation") as HTMLElement & { inert: boolean };
    expect(main.inert).toBe(true);
    expect(root.querySelectorAll("[data-stack-layer]")).toHaveLength(3); // hero, statement, story
    expect(["details", "venue", "rsvp", "wishes"].every((id) => root.querySelector("#" + id))).toBe(true);
    expect(root.querySelector("h1")!.getAttribute("aria-label")).toBe("Adrian & Isabella");
    expect(document.documentElement.style.overflow).toBe("hidden"); // scroll is locked until the cover opens
  });

  it("hides sections the invitation does not have (no gallery, gift or music here)", () => {
    const { container } = render(<GildedSeal mode="live" invite={invite} token="t" />);
    expect(container.querySelector("#gallery")).toBeNull();
    expect(container.querySelector("#gift")).toBeNull();
  });

  it("the demo needs no invite", () => {
    const { container } = render(<GildedSeal mode="demo" />);
    expect(container.querySelector("h1")!.getAttribute("aria-label")).toBe("Adrian & Isabella");
    expect(container.querySelector("#gallery")).toBeTruthy();
    expect(container.querySelector("#gift")).toBeTruthy();
  });

  it("live and preview without an invite are a programming error, not a silent demo", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<GildedSeal mode="live" />)).toThrow(/need an invite/);
    err.mockRestore();
  });

  it("opens: the cover button leaves the cover, finishes after the reduced path, unlocks scroll and un-inerts the page", async () => {
    const { container } = render(<GildedSeal mode="demo" />);
    await act(finishLoading);
    const btn = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("Open Invitation"))!;
    expect(btn).toBeTruthy();
    await act(async () => {
      btn.click();
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect((container.querySelector("main") as HTMLElement & { inert: boolean }).inert).toBe(false);
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.activeElement).toBe(container.querySelector("h1"));
  });

  it("Escape during the opening skips it", async () => {
    const { container } = render(<GildedSeal mode="demo" />);
    await act(finishLoading);
    await act(async () => {
      [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("Open Invitation"))!.click();
      await vi.advanceTimersByTimeAsync(50); // mid-opening: the skip button is showing
    });
    expect([...container.querySelectorAll("button")].some((b) => b.textContent === "Skip intro")).toBe(true);
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("leaves nothing behind on unmount, including under StrictMode's mount → unmount → mount", () => {
    const { unmount } = render(
      <StrictMode>
        <GildedSeal mode="demo" />
      </StrictMode>,
    );
    expect(document.documentElement.style.overflow).toBe("hidden");
    unmount();
    expect(rafQueue.size).toBe(0); // no frame left scheduled
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.body.style.overflow).toBe("");
    for (const type of ["pointermove", "keydown", "resize"]) expect(listeners.get(type) ?? 0, `${type} listeners`).toBe(0);
    expect(vi.getTimerCount()).toBe(0); // no timer left running
    expect(lenis.created).toBe(lenis.destroyed);
  });
});
