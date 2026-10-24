import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LAYERS, themedLayers } from "@/components/templates/gilded-seal/gl/layers";
import { MANIFESTS } from "@/lib/kit/generated/manifests";
import { resolveTheme } from "@/lib/kit/tokens";
import GildedSeal from "./helpers/gilded-seal";

vi.mock("lenis", () => ({ default: class { stop() {} start() {} raf() {} scrollTo() {} destroy() {} } }));

beforeEach(() => {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  window.scrollTo = vi.fn() as typeof window.scrollTo;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const BOUNDED = ["F7F2E9", "302720", "271F19", "4A3E35", "6B5D52", "5E5046", "A98545", "B08E52", "E8D7AD", "FCF9F3", "8E4A43", "6E5730", "7E6436"];

describe("Gilded Seal on design tokens (docs/17 §6.5)", () => {
  it("no bounded role colour is a literal in the markup any more: all of them are theme variables", () => {
    const { container } = render(<GildedSeal mode="demo" />);
    const html = (container.querySelector("[data-template]") as HTMLElement).outerHTML;
    for (const hex of BOUNDED) expect(html.toUpperCase(), `#${hex}`).not.toContain(`#${hex}`);
    expect(html).toContain("var(--k-accent)");
    expect(html).toContain("var(--k-line)");
    expect(html).toContain("var(--k-x-eyebrow)");
    expect(html).toContain("var(--k-font-display)");
  });

  it("every variable the template reads is defined by the default theme", () => {
    const { container } = render(<GildedSeal mode="demo" />);
    const used = new Set([...(container.querySelector("[data-template]") as HTMLElement).outerHTML.matchAll(/var\((--k-[a-z0-9-]+)\)/g)].map((m) => m[1]));
    const defined = new Set(Object.keys(resolveTheme(MANIFESTS["gilded-seal"]).vars));
    expect([...used].filter((v) => !defined.has(v))).toEqual([]);
    expect(used.size).toBeGreaterThan(8);
  });
});

describe("shader layers follow the theme", () => {
  const base = resolveTheme(MANIFESTS["gilded-seal"]).colors;
  it("with the template's own colours they are the prototype's numbers", () => {
    expect(themedLayers(base)).toBe(LAYERS);
  });
  it("a different gold line re-colours the contour lines of hero and closing; a different soft tint, the date section's", () => {
    const t = themedLayers({ ...base, line: "#FF0000", accentSoft: "#00FF00" });
    expect(t.hero.uLine).toEqual([1, 0, 0]);
    expect(t.closing.uLine).toEqual([1, 0, 0]);
    expect(t.date.uLine).toEqual([0, 1, 0]);
    expect(t.hero.uBase).toEqual(LAYERS.hero.uBase);
    expect(t.burn).toBe(LAYERS.burn);
  });
});
