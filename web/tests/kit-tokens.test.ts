import { describe, expect, it } from "vitest";
import { FONT_PAIRINGS } from "@/lib/kit/generated/fonts";
import { MANIFESTS } from "@/lib/kit/generated/manifests";
import { PALETTES } from "@/lib/kit/generated/palettes";
import { TRACKS } from "@/lib/kit/generated/music";
import type { Manifest } from "@/lib/kit/manifest";
import { fontFaceCss, preloadSources } from "@/lib/kit/fonts";
import { readMotionPolicy, resolveMotionPolicy } from "@/lib/kit/motion/policy";
import { TEXT_PAIRS, contrast, paletteByIdOrAlias, resolveTheme } from "@/lib/kit/tokens";
import { trackByKey } from "@/lib/kit/music";

const gs = MANIFESTS["gilded-seal"];
/** The Gilded Seal manifest with the host allowed to change things. */
const open = (over: Partial<Manifest["customizable"]> = {}): Manifest => ({
  ...gs,
  customizable: { palette: PALETTES.map((p) => p.id), fontPairings: FONT_PAIRINGS.map((p) => p.id), tokens: ["accent", "eyebrow"], motion: ["full", "calm"], ...over },
});

describe("palettes (docs/17 §7.1)", () => {
  it("has at least six, and every legacy label resolves", () => {
    expect(PALETTES.length).toBeGreaterThanOrEqual(6);
    for (const [alias, id] of Object.entries({ Ivory: "gold-ivory", Stone: "stone-linen", Blush: "rose-linen", Forest: "sage-parchment", Midnight: "midnight-gold" })) {
      expect(paletteByIdOrAlias(alias)?.id).toBe(id);
    }
    expect(paletteByIdOrAlias("nope")).toBeUndefined();
    expect(paletteByIdOrAlias(null)).toBeUndefined();
  });

  it.each(PALETTES.map((p) => [p.id, p] as const))("%s keeps text readable over the Gilded Seal defaults (AA 4.5:1)", (_id, p) => {
    const merged: Record<string, string> = { ...gs.tokens.color, ...p.color };
    for (const [fg, bg] of TEXT_PAIRS) expect(contrast(merged[fg], merged[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it("the Gilded Seal defaults themselves pass", () => {
    for (const [fg, bg] of TEXT_PAIRS) expect(contrast(gs.tokens.color[fg], gs.tokens.color[bg])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("resolveTheme (docs/17 §6.3)", () => {
  it("with no overrides gives the manifest defaults as CSS variables", () => {
    const t = resolveTheme(gs);
    expect(t.vars["--k-bg"]).toBe("#F7F2E9");
    expect(t.vars["--k-ink"]).toBe("#302720");
    expect(t.vars["--k-accent"]).toBe("#A98545");
    expect(t.vars["--k-on-accent"]).toBe("#271F19");
    expect(t.vars["--k-x-eyebrow"]).toBe("#6E5730");
    expect(t.vars["--k-font-display"]).toBe('"Cormorant Garamond", serif');
    expect(t.vars["--k-motion-scale"]).toBe("1");
    expect(t.motion).toEqual({ level: "full", durationScale: 1 });
    expect(t.palette).toBeNull();
    expect(t.colors.line).toBe("#B08E52");
  });

  it("ignores a palette, pairing, motion or colour the template does not list", () => {
    const none: Manifest = { ...gs, customizable: { palette: [], fontPairings: [], tokens: [], motion: [] } };
    const t = resolveTheme(none, { palette: "midnight-gold", fontPairing: "classic-serif", motion: "calm", tokens: { accent: "#FF0000" } });
    expect(t.vars["--k-bg"]).toBe("#F7F2E9");
    expect(t.vars["--k-accent"]).toBe("#A98545");
    expect(t.motion.level).toBe("full");
    expect(t.palette).toBeNull();
  });

  it("applies a listed palette, by id or by legacy label", () => {
    expect(resolveTheme(open(), { palette: "midnight-gold" }).vars["--k-bg"]).toBe("#1C2233");
    const byAlias = resolveTheme(open(), { palette: "Forest" });
    expect(byAlias.palette).toBe("sage-parchment");
    expect(byAlias.vars["--k-ink"]).toBe("#2F3A2E");
    expect(resolveTheme(open({ palette: ["rose-linen"] }), { palette: "midnight-gold" }).palette).toBeNull();
  });

  it("host colours win over the palette, only for listed roles and only as #RRGGBB", () => {
    const t = resolveTheme(open(), { palette: "midnight-gold", tokens: { accent: "#112233", eyebrow: "#445566" } });
    expect(t.vars["--k-accent"]).toBe("#112233");
    expect(t.vars["--k-x-eyebrow"]).toBe("#445566");
    expect(t.vars["--k-bg"]).toBe("#1C2233"); // palette kept
    for (const bad of ["red", "url(x)", "#12", "var(--x)", "#GGGGGG", "#1122334"]) {
      expect(resolveTheme(open(), { tokens: { accent: bad } }).vars["--k-accent"], bad).toBe("#A98545");
    }
    expect(resolveTheme(open(), { tokens: { bg: "#000000" } }).vars["--k-bg"]).toBe("#F7F2E9"); // bg not listed
    expect(resolveTheme(open(), { tokens: { sparkle: "#000000" } }).colors.sparkle).toBeUndefined();
  });

  it("applies a listed font pairing and motion level", () => {
    const t = resolveTheme(open(), { fontPairing: "classic-serif", motion: "calm" });
    expect(t.pairing).toBe("classic-serif");
    expect(t.fontIds).toMatchObject({ display: "cormorant", body: "manrope", script: "pinyon" });
    expect(t.motion.level).toBe("calm");
    expect(resolveTheme(open({ motion: ["full"] }), { motion: "calm" }).motion.level).toBe("full");
  });

  it("has no CSS-injection surface: every value is a hex colour, a font stack or a number", () => {
    const t = resolveTheme(open(), { palette: "rose-linen", tokens: { accent: "#AABBCC" } });
    for (const [k, v] of Object.entries(t.vars)) {
      if (k.startsWith("--k-font-")) expect(v).toMatch(/^"[A-Za-z ]+", [A-Za-z, -]+$/);
      else if (k === "--k-motion-scale") expect(v).toMatch(/^[0-9.]+$/);
      else expect(v, k).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe("motion policy (docs/17 §7.3)", () => {
  it("full motion is the default", () => {
    expect(resolveMotionPolicy({ reducedMotion: false, fine: true })).toEqual({ level: "full", reduced: false, fine: true, durationScale: 1, parallaxScale: 1, webgl: true, smoothScroll: true });
  });
  it("reduced motion wins over the host's choice: off, no WebGL, no smooth scroll", () => {
    const p = resolveMotionPolicy({ reducedMotion: true, fine: false, themeLevel: "full" });
    expect(p).toMatchObject({ level: "off", reduced: true, webgl: false, smoothScroll: false, parallaxScale: 0 });
  });
  it("calm slows durations ×1.4, halves parallax and drops the WebGL cover", () => {
    const p = resolveMotionPolicy({ reducedMotion: false, fine: true, themeLevel: "calm" });
    expect(p).toMatchObject({ level: "calm", durationScale: 1.4, parallaxScale: 0.5, webgl: false, smoothScroll: true });
  });
  it("no matchMedia counts as reduced (server, bare environments)", () => {
    const mm = globalThis.matchMedia;
    // @ts-expect-error simulate an environment without matchMedia
    globalThis.matchMedia = undefined;
    try {
      expect(readMotionPolicy().reduced).toBe(true);
    } finally {
      globalThis.matchMedia = mm;
    }
  });
});

describe("fonts (docs/17 §7.2)", () => {
  it("emits @font-face only for the families asked for, with swap", () => {
    const css = fontFaceCss(["cormorant", "pinyon"]);
    expect(css).toContain("font-family:Cormorant Garamond");
    expect(css).toContain("font-family:Pinyon Script");
    expect(css).not.toContain("Manrope");
    expect(css.match(/font-display:swap/g)).toHaveLength(3); // cormorant normal + italic, pinyon
    expect(css).not.toMatch(/["'<>&]/); // React escapes these in <style> text
  });
  it("preloads the first file of each family once", () => {
    expect(preloadSources(["cormorant", "manrope", "cormorant"])).toEqual(["/fonts/cormorant/CormorantGaramond-normal.woff2", "/fonts/manrope/Manrope-normal.woff2"]);
    expect(preloadSources(["unknown"])).toEqual([]);
  });
});

describe("music catalog", () => {
  it("every track names its licence and resolves by key", () => {
    for (const t of TRACKS) expect(t.license).not.toBe("");
    expect(trackByKey("satie-gymnopedie-1")?.title).toBe("Gymnopédie No. 1");
    expect(trackByKey("nope")).toBeNull();
    expect(trackByKey(null)).toBeNull();
  });
});
