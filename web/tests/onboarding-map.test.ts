import { describe, it, expect } from "vitest";
import { splitNames, dateToRFC3339, typeSlug } from "@/components/admin/onboarding-map";

describe("onboarding mapping", () => {
  it("splits couple names", () => {
    expect(splitNames("Raden & Cilla")).toEqual(["Raden", "Cilla"]);
    expect(splitNames("Raden and Cilla")).toEqual(["Raden", "Cilla"]);
    expect(splitNames("Raden&Cilla")).toEqual(["Raden", "Cilla"]);
    expect(splitNames("Naya")).toEqual(["Naya", null]);
    expect(splitNames("  ")).toEqual([null, null]);
  });
  it("converts date", () => {
    expect(dateToRFC3339("2027-04-12")).toBe("2027-04-12T09:00:00Z");
    expect(dateToRFC3339("12/04/2027")).toBeNull();
    expect(dateToRFC3339("")).toBeNull();
  });
  it("slugs the type", () => {
    expect(typeSlug("17th Birthday")).toBe("17th-birthday");
    expect(typeSlug("Product launch")).toBe("product-launch");
  });
});

import { eventLabel } from "@/components/admin/event-label";
describe("event label", () => {
  it("builds a display name from the real API shape", () => {
    expect(eventLabel({ couple_a: "Raden", couple_b: "Cilla", type: "wedding" })).toBe("Raden & Cilla");
    expect(eventLabel({ couple_a: "Naya", couple_b: null, type: "17th-birthday" })).toBe("Naya");
    expect(eventLabel({ couple_a: null, couple_b: null, type: "product-launch" })).toBe("Product launch");
    expect(eventLabel({})).toBe("Untitled celebration");
  });
});
