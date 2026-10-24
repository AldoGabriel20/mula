import { describe, expect, it } from "vitest";
import { paletteOf, PALETTE } from "@/components/marketing/paletteSwatch";
import { PALETTES } from "@/lib/kit/generated/palettes";
import { paletteIndex, paletteValue, protoPals } from "@/components/admin/mappers";

// TK-040: the dashboard addresses palettes by index, the catalog is the only source, a stored value is an id or a legacy label.
describe("admin palettes come from the catalog", () => {
  it("the six prototype swatches are the catalog's first six, in order", () => {
    const pals = protoPals();
    expect(pals).toHaveLength(6);
    pals.forEach((p, i) => expect(p).toEqual({ n: PALETTES[i].name, bg: PALETTES[i].swatch[0], fg: PALETTES[i].swatch[1], ac: PALETTES[i].swatch[2] }));
  });
  it("saving writes the palette id; every id and legacy label reads back to the same index", () => {
    for (let i = 0; i < 6; i++) {
      expect(paletteValue(i)).toBe(PALETTES[i].id);
      expect(paletteIndex(PALETTES[i].id)).toBe(i);
      for (const a of PALETTES[i].aliases) expect(paletteIndex(a)).toBe(i);
    }
    expect(paletteIndex("Forest")).toBe(paletteIndex("sage-parchment"));
    expect(paletteIndex("nope")).toBeUndefined();
    expect(paletteIndex(undefined)).toBeUndefined();
    expect(paletteValue(99)).toBe(PALETTES[0].id);
  });
});

describe("paletteOf keeps legacy labels pixel-neutral and understands ids", () => {
  it("a legacy label or its id gives the label's own gradient", () => {
    expect(paletteOf("Forest")).toBe(PALETTE.Forest);
    expect(paletteOf("sage-parchment")).toBe(PALETTE.Forest);
    expect(paletteOf("gold-ivory")).toBe(PALETTE.Ivory);
  });
  it("an id without a legacy label derives its gradient from the catalog swatch; unknown falls back to Ivory", () => {
    const g = paletteOf("terracotta-sand");
    expect(g.bg).toContain(PALETTES.find((p) => p.id === "terracotta-sand")!.swatch[0]);
    expect(paletteOf("nope")).toBe(PALETTE.Ivory);
  });
});
