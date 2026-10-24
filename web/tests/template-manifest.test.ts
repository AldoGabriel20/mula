import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FONT_FAMILIES, FONT_PAIRINGS } from "@/lib/kit/generated/fonts";
import { MANIFESTS } from "@/lib/kit/generated/manifests";
import { PALETTES } from "@/lib/kit/generated/palettes";
import { TEMPLATE_SLUGS, hasLiveTemplate } from "@/lib/kit/generated/registry";
import { SECTION_SCHEMAS } from "@/lib/kit/generated/sections";
import { TEXT_PAIRS, contrast, paletteByIdOrAlias, resolveTheme } from "@/lib/kit/tokens";

// TK-060 — manifest contract, run for every template in the catalog at test time (docs/17 §16). The Go validator
// (`go run ./cmd/templates validate`) is the authoring-time gate; this is the same rules against what the web app
// actually imports, so a stale generated file cannot hide a broken manifest.
const ROOT = path.resolve(__dirname, "..");
const CORE = ["bg", "surface", "ink", "inkSoft", "muted", "accent", "accentSoft", "line", "danger", "onAccent"];

describe.each(Object.values(MANIFESTS).map((m) => [m.slug, m] as const))("manifest %s", (slug, m) => {
  it("is keyed by its slug and valid in shape", () => {
    expect(MANIFESTS[slug]).toBe(m);
    expect(m.slug).toMatch(/^[a-z][a-z0-9-]{1,40}$/);
    expect(m.manifestVersion).toBe(1);
    expect(["coded", "themed"]).toContain(m.kind);
  });

  it("defines every colour role as #RRGGBB and keeps its text pairs readable (AA 4.5:1)", () => {
    for (const r of CORE) expect(m.tokens.color[r as keyof typeof m.tokens.color], r).toMatch(/^#[0-9A-Fa-f]{6}$/);
    for (const [fg, bg] of TEXT_PAIRS) expect(contrast(m.tokens.color[fg], m.tokens.color[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it("every listed palette, pairing and token exists, and every listed palette stays readable", () => {
    for (const id of m.customizable.palette) {
      const p = paletteByIdOrAlias(id);
      expect(p, id).toBeDefined();
      const t = resolveTheme(m, { palette: id });
      for (const [fg, bg] of TEXT_PAIRS) expect(contrast(t.colors[fg], t.colors[bg]), `${id}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
    for (const id of m.customizable.fontPairings) expect(FONT_PAIRINGS.some((p) => p.id === id), id).toBe(true);
    for (const t of m.customizable.tokens) expect(t in m.tokens.color || t in (m.tokens.extra ?? {}), t).toBe(true);
    expect(paletteByIdOrAlias(m.palette)).toBeDefined();
    for (const f of Object.values(m.tokens.font)) expect(FONT_FAMILIES[f], f).toBeDefined();
  });

  it("only lists section types that have a content schema, once each, and its gallery cap agrees", () => {
    const seen = new Set<string>();
    for (const s of m.sections) {
      expect(SECTION_SCHEMAS[s.type], s.type).toBeDefined();
      expect(seen.has(s.type), `duplicate ${s.type}`).toBe(false);
      seen.add(s.type);
      expect(s.required && s.hiddenUntilFilled, `${s.type} required+hiddenUntilFilled`).toBeFalsy();
      if (s.type === "gallery" && s.max) expect(s.max).toBe(m.capabilities.gallery.max);
    }
  });

  it("a coded template has its renderer file, is in the generated registry and has a demo route; a themed one has a layout", () => {
    if (m.kind === "coded") {
      expect(m.renderer).toBeTruthy();
      expect(fs.existsSync(path.join(ROOT, "components/templates", `${m.renderer}.tsx`)), `renderer ${m.renderer}`).toBe(true);
      expect(hasLiveTemplate(slug)).toBe(m.status === "published");
      expect(m.layout).toBeUndefined();
      if (m.status === "published") expect(m.marketing.demo?.route).toBe(`/demo/${slug}`);
    } else {
      expect(m.layout?.length).toBeGreaterThan(0);
      expect(hasLiveTemplate(slug)).toBe(false);
    }
  });

  it("the default theme resolves to variables only (hex, font stacks, a scale)", () => {
    for (const [k, v] of Object.entries(resolveTheme(m).vars)) {
      if (k.startsWith("--k-font-")) expect(v).toMatch(/^"[^"]+", [A-Za-z, -]+$/);
      else if (k === "--k-motion-scale") expect(v).toMatch(/^[0-9.]+$/);
      else expect(v, k).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe("generated registry", () => {
  it("lists exactly the published coded templates", () => {
    const want = Object.values(MANIFESTS).filter((m) => m.kind === "coded" && m.status === "published").map((m) => m.slug);
    expect([...TEMPLATE_SLUGS]).toEqual(want);
  });
});

describe("palettes", () => {
  it("have unique ids and aliases, three swatches, hex colours", () => {
    const names = new Set<string>();
    for (const p of PALETTES) {
      for (const n of [p.id, ...p.aliases]) {
        expect(names.has(n), `duplicate ${n}`).toBe(false);
        names.add(n);
      }
      expect(p.swatch).toHaveLength(3);
      for (const v of [...p.swatch, ...Object.values(p.color), ...Object.values(p.extra ?? {})]) expect(v).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
