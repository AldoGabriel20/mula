import { describe, expect, it } from "vitest";
import { TICKS, eventLayout, eventSlide, figureOpacity, galleryPlan, heroLayout, venueLayout, venueSlide, wishLayout, wishSlots } from "@/components/templates/gilded-seal/layout";

describe("heroLayout", () => {
  it("wide: photo on the right, text column on the left, hero line shown", () => {
    const h = heroLayout(1440, 900, "Adrian", "Isabella");
    expect(h.pH).toBe(702); // min(.78 × 900, 900)
    expect(h.pW).toBe(Math.min(Math.round(1440 * 0.36), Math.round(702 * 0.74)));
    expect(h.pL + h.pW).toBe(Math.round(1440 * 0.91));
    expect(h.tL).toBe(Math.round(1440 * 0.075));
    expect(h).toMatchObject({ align: "flex-start", talign: "left", line: true, fade: 0, indent: ".55em" });
    expect(h.tW).toBeGreaterThanOrEqual(300);
  });
  it("narrow: centred, line hidden, photo shrinks to leave room for the text", () => {
    const h = heroLayout(390, 844, "Adrian", "Isabella");
    expect(h).toMatchObject({ align: "center", talign: "center", line: false, fade: 1, tL: 20, tW: 350, indent: "0" });
    expect(h.pL).toBe(Math.round((390 - h.pW) / 2));
    expect(h.tT).toBe(h.pT + h.pH - 70);
    const short = heroLayout(390, 560, "Adrian", "Isabella");
    expect(short.pH).toBeLessThanOrEqual(h.pH);
    expect(short.pH).toBeGreaterThanOrEqual(240);
  });
  it("the breakpoint is 880", () => {
    expect(heroLayout(880, 800, "A", "B").line).toBe(true);
    expect(heroLayout(879, 800, "A", "B").line).toBe(false);
  });
});

describe("event carousel", () => {
  it("sizes cards by viewport", () => {
    expect(eventLayout(1440)).toMatchObject({ w: 900, h: 500, cols: "42% minmax(0,1fr)" });
    expect(eventLayout(1000)).toMatchObject({ w: 700 });
    expect(eventLayout(390)).toMatchObject({ w: 354, h: 620, rows: "220px minmax(0,1fr)" });
  });
  it("wide: a 3D coverflow around the active card; reduced: plain slides", () => {
    const a = eventSlide(0, 0, 1440, false);
    expect(a).toMatchObject({ tf: "translate3d(0px,0,0px) rotateY(0deg)", op: 1, z: 10, vis: "visible", hidden: false, inactive: false, tab: 0 });
    const next = eventSlide(1, 0, 1440, false);
    expect(next.tf).toBe(`translate3d(${Math.round(900 * 0.74)}px,0,-300px) rotateY(-26deg)`);
    expect(next).toMatchObject({ op: 0.5, z: 9, hidden: true, tab: -1 });
    expect(eventSlide(2, 0, 1440, false)).toMatchObject({ op: 0, vis: "hidden", visDelay: "1s" });
    expect(eventSlide(1, 0, 1440, true)).toMatchObject({ tf: "translate3d(110%,0,0)", op: 0 });
  });
  it("narrow slides sideways and shrinks the neighbours", () => {
    expect(eventSlide(1, 0, 390, false).tf).toBe("translate3d(370px,0,0) scale(0.94)");
    expect(eventSlide(0, 0, 390, false).tf).toBe("translate3d(0px,0,0) scale(1)");
  });
});

describe("venue", () => {
  it("wide uses a 12-column grid with the card overlapping the photo", () => {
    expect(venueLayout(1440, 900)).toMatchObject({ cols: "repeat(12,minmax(0,1fr))", photoCol: "1 / 9", infoCol: "8 / 13", infoRow: "1", infoM: "0", photoH: 720 });
    expect(venueLayout(1440, 500).photoH).toBe(520);
    expect(venueLayout(390, 844)).toMatchObject({ photoCol: "1", infoRow: "2", infoM: "-56px 12px 0", photoH: 410 });
  });
  it("wipes the previous slide left and the next one in from the right", () => {
    expect(venueSlide(1, 1)).toMatchObject({ clip: "inset(0% 0% 0% 0%)", sc: 1, op: 1, vis: "visible", inDelay: ".25s" });
    expect(venueSlide(0, 1).clip).toBe("inset(0% 100% 0% 0%)");
    expect(venueSlide(2, 1).clip).toBe("inset(0% 0% 0% 100%)");
    expect(venueSlide(2, 1)).toMatchObject({ sc: 1.14, op: 0, vis: "hidden", visDelay: ".7s" });
  });
});

describe("wish deck ring buffer", () => {
  const wishes = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `w${i}`, name: `N${i}`, message: "x".repeat(i === 0 ? 30 : i === 1 ? 120 : 200) }));
  it("is empty without wishes and never has more than five cards", () => {
    expect(wishSlots([], 0, 1440)).toEqual([]);
    expect(wishSlots(wishes(40), 7, 1440)).toHaveLength(5);
  });
  it("the current wish is on top; the previous flies off; two peek behind", () => {
    const slots = wishSlots(wishes(7), 3, 1440);
    const by = (id: string) => slots.find((s) => s.id === id)!;
    expect(by("w3")).toMatchObject({ hidden: false, op: 1, tf: "none", z: 10 });
    expect(by("w2")).toMatchObject({ z: 12, tf: "translate3d(-115%,-10px,40px) rotate(-8deg)", hidden: true });
    expect(by("w4")).toMatchObject({ op: 0.75, z: 9, tf: "translate3d(0,16px,-70px) rotate(1.2deg)" });
    expect(by("w5")).toMatchObject({ op: 0.45, z: 8, tf: "translate3d(0,32px,-140px) rotate(-1deg)" });
    expect(by("w6").op).toBe(0); // the fourth card is not shown yet
  });
  it("keeps its card indices stable as the index moves (a ring, not a re-render of every slot)", () => {
    const at = (i: number) => wishSlots(wishes(9), i, 1440).map((s) => s.id);
    // moving forward by one only changes the one slot that wraps around
    const a = at(4);
    const b = at(5);
    expect(a.filter((id, k) => id !== b[k])).toHaveLength(1);
  });
  it("handles one and two wishes and negative positions", () => {
    expect(wishSlots(wishes(1), 0, 1440).filter((s) => s.op > 0).map((s) => s.op)).toEqual([1]);
    const two = wishSlots(wishes(2), 0, 1440);
    expect(two.find((s) => !s.hidden)!.id).toBe("w0");
    expect(two.filter((s) => s.op === 0.75)).toHaveLength(1);
    expect(wishSlots(wishes(3), -1, 1440).find((s) => !s.hidden)!.id).toBe("w2"); // wraps backwards
  });
  it("picks a font size by length, smaller on phones", () => {
    const [short] = wishSlots([{ id: "a", name: "A", message: "hi" }], 0, 1440);
    const [phone] = wishSlots([{ id: "a", name: "A", message: "hi" }], 0, 390);
    const [long] = wishSlots([{ id: "a", name: "A", message: "x".repeat(200) }], 0, 1440);
    expect([short.fs, phone.fs, long.fs]).toEqual([29, 24, 19]);
    expect(wishLayout(1440)).toEqual({ h: 400, pad: 46, cardH: 364 });
    expect(wishLayout(390)).toEqual({ h: 440, pad: 28, cardH: 404 });
  });
});

describe("gallery corridor", () => {
  it("eight photos reproduce the prototype: 460svh, 6850 px of camera travel, last figure dead centre", () => {
    const p = galleryPlan(8);
    expect(p.heightSvh).toBe(460);
    expect(p.camZMax).toBe(6850);
    expect(p.figures.map((f) => f.z)).toEqual([-500, -1450, -2400, -3350, -4300, -5250, -6200, -7150]);
    expect(p.figures[0]).toMatchObject({ x: -21, y: -3, rot: 11 });
    expect(p.figures[7]).toMatchObject({ x: 0, y: 0, rot: 0 });
  });
  it("scales with the photo count; the last figure is always centred", () => {
    for (const n of [1, 2, 5, 12]) {
      const p = galleryPlan(n);
      expect(p.heightSvh).toBe(100 + n * 45);
      expect(p.camZMax).toBe(950 * (n - 1) + 200);
      expect(p.figures).toHaveLength(n);
      expect(p.figures[n - 1]).toMatchObject({ x: 0, y: 0, rot: 0 });
    }
    // the centred slot of the cycle is skipped for earlier figures
    expect(galleryPlan(10).figures[7]).toMatchObject({ x: -19 });
  });
  it("fades a figure in from afar and out as the camera passes it (d = z + camZ)", () => {
    expect(figureOpacity(-7150, 0)).toBe(0); // 7150 px away: invisible
    expect(figureOpacity(-3900, 0)).toBeCloseTo(0.5, 5); // fading in (d = -3900)
    expect(figureOpacity(-2600, 0)).toBe(1); // fully in from 2600 px
    expect(figureOpacity(-300, 0)).toBe(1); // close, in front of the camera
    expect(figureOpacity(0, 310)).toBeCloseTo(0.5, 5); // passing the camera (d = 310)
    expect(figureOpacity(0, 600)).toBe(0); // behind it
  });
});

describe("ring ticks", () => {
  it("has 60, with a longer, heavier tick every fifth", () => {
    expect(TICKS).toHaveLength(60);
    expect(TICKS[0]).toEqual({ x1: "300.00", y1: "16.00", x2: "300.00", y2: "0.00", w: 1.4 });
    expect(TICKS[1].w).toBe(0.8);
    expect(TICKS.filter((t) => t.w === 1.4)).toHaveLength(12);
    expect(TICKS[15].x2).toBe("600.00"); // quarter turn
  });
});
