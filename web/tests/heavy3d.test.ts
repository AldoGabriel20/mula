import { afterEach, describe, expect, it, vi } from "vitest";
import { canRunHeavy3D } from "@/lib/three/webgl";

// Policy (docs/04): desktop full 3D; tablet/mobile/touch → poster, decided BEFORE three loads.
function env(o: { narrow?: boolean; saveData?: boolean; type?: string; mem?: number } = {}) {
  vi.stubGlobal("window", { matchMedia: (q: string) => ({ matches: q.includes("max-width: 900px") ? !!o.narrow : false }) });
  vi.stubGlobal("navigator", {
    connection: o.saveData !== undefined || o.type ? { saveData: o.saveData, effectiveType: o.type } : undefined,
    deviceMemory: o.mem,
  });
}
afterEach(() => vi.unstubAllGlobals());

describe("canRunHeavy3D", () => {
  it("runs on a normal desktop", () => {
    env();
    expect(canRunHeavy3D(true)).toBe(true);
  });
  it("never runs without a fine pointer (touch-first)", () => {
    env();
    expect(canRunHeavy3D(false)).toBe(false);
  });
  it("never runs in a narrow window, even with a mouse", () => {
    env({ narrow: true });
    expect(canRunHeavy3D(true)).toBe(false);
  });
  it("honours the data-saver flag", () => {
    env({ saveData: true });
    expect(canRunHeavy3D(true)).toBe(false);
  });
  it("skips slow connections but not fast ones", () => {
    for (const t of ["slow-2g", "2g", "3g"]) {
      env({ type: t });
      expect(canRunHeavy3D(true), t).toBe(false);
    }
    for (const t of ["4g", "wifi"]) {
      env({ type: t });
      expect(canRunHeavy3D(true), t).toBe(true);
    }
  });
  it("skips low-memory devices (< 4 GB) and runs when memory is unknown or enough", () => {
    env({ mem: 2 });
    expect(canRunHeavy3D(true)).toBe(false);
    env({ mem: 4 });
    expect(canRunHeavy3D(true)).toBe(true);
    env({}); // deviceMemory not exposed (Safari/Firefox) → don't penalise
    expect(canRunHeavy3D(true)).toBe(true);
  });
});
