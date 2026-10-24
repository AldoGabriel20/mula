import { afterEach, describe, expect, it, vi } from "vitest";
import { detectLowGL, preferLite } from "@/lib/kit/gl/detect";
import { VERT, makeLayer } from "@/lib/kit/gl/layer";
import { LAYERS, themedLayers } from "@/components/templates/gilded-seal/gl/layers";
import { FRAG_BURN, FRAG_CONTOUR } from "@/components/templates/gilded-seal/gl/shaders";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("shaders", () => {
  it("are WebGL2 sources taken verbatim from the prototype", () => {
    for (const src of [VERT, FRAG_CONTOUR, FRAG_BURN]) expect(src.startsWith("#version 300 es")).toBe(true);
    expect(FRAG_CONTOUR).toContain("uniform vec3 uBase;");
    expect(FRAG_CONTOUR).toContain("float field(vec2 p, float t)");
    expect(FRAG_BURN).toContain("float fbm(vec2 p)");
    expect(FRAG_BURN).toContain("uniform float uP;");
  });
  it("every uniform a layer sets exists in its shader", () => {
    for (const k of Object.keys(LAYERS.hero)) expect(FRAG_CONTOUR).toContain(k);
    for (const k of Object.keys(LAYERS.burn)) expect(FRAG_BURN).toContain(k);
  });
});

describe("makeLayer", () => {
  it("returns null without a canvas or without WebGL2 (callers keep the static background)", () => {
    expect(makeLayer(null, FRAG_BURN, LAYERS.burn)).toBeNull();
    const cv = document.createElement("canvas");
    vi.spyOn(cv, "getContext").mockReturnValue(null);
    expect(makeLayer(cv, FRAG_BURN, LAYERS.burn)).toBeNull();
  });
  it("returns null, not a throw, when the shader fails to compile", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const gl = { createShader: () => ({}), shaderSource() {}, compileShader() {}, getShaderParameter: () => false, getShaderInfoLog: () => "syntax error", VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3 };
    const cv = document.createElement("canvas");
    vi.spyOn(cv, "getContext").mockReturnValue(gl as unknown as RenderingContext);
    expect(makeLayer(cv, FRAG_BURN, LAYERS.burn)).toBeNull();
    expect(warn).toHaveBeenCalled();
  });
});

describe("detectLowGL / preferLite", () => {
  it("is true when there is no WebGL, or the renderer is software", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(detectLowGL()).toBe(true);
    const mk = (name: string) => ({ getExtension: (n: string) => (n === "WEBGL_debug_renderer_info" ? { UNMASKED_RENDERER_WEBGL: 1 } : { loseContext() {} }), getParameter: () => name, RENDERER: 0 });
    for (const [renderer, low] of [["Google SwiftShader", true], ["llvmpipe (LLVM 15)", true], ["ANGLE (Apple, Apple M2)", false], ["NVIDIA GeForce RTX", false]] as const) {
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(mk(renderer) as unknown as RenderingContext);
      expect(detectLowGL(), renderer).toBe(low);
    }
  });
  it("prefers the lite cover for data-saver and 2g, but not for 3g or fast links", () => {
    const set = (c: unknown) => vi.stubGlobal("navigator", { connection: c });
    set({ saveData: true });
    expect(preferLite()).toBe(true);
    set({ effectiveType: "2g" });
    expect(preferLite()).toBe(true);
    set({ effectiveType: "slow-2g" });
    expect(preferLite()).toBe(true);
    set({ effectiveType: "3g" });
    expect(preferLite()).toBe(false);
    set({ effectiveType: "4g" });
    expect(preferLite()).toBe(false);
    set(undefined);
    expect(preferLite()).toBe(false);
  });
});
