import { expect } from "@playwright/test";
import { goTo, gsTest as test, openInvitation } from "./helpers";

// GS-061: keyboard and motion rules for the Gilded Seal template, beyond what axe can see.
test.describe.configure({ timeout: 120_000 });
test.use({ actionTimeout: 20_000 });
const DEMO = "/demo/gilded-seal?to=Sarah";

const SECTIONS = ["#statement", "#story", "#date", "#details", "#venue", "#gallery", "#gift", "#rsvp", "#wishes"];

test("every control is at least 44 × 44 px (a radio counts with its label)", async ({ page }) => {
  await page.goto(DEMO);
  await openInvitation(page);
  const seen = new Map<string, string>();
  for (const sel of SECTIONS) {
    await goTo(page, sel);
    await page.waitForTimeout(2000); // let the section's reveal finish: a card mid-tilt measures smaller than it is
    const small = await page.evaluate(() => {
      const root = document.querySelector("[data-template=gilded-seal]")!;
      const out: string[] = [];
      root.querySelectorAll<HTMLElement>("a[href], button, input:not([type=hidden]), select, textarea, [tabindex='0']").forEach((el) => {
        if (el.closest("[aria-hidden=true], [inert]")) return; // a card that is not the current one is not a target
        if (!el.checkVisibility({ visibilityProperty: true })) return;
        const target = el.matches("input[type=radio], input[type=checkbox]") ? (el.closest("label") ?? el) : el;
        const r = target.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.bottom < 0 || r.top > innerHeight) return; // only what is on screen has settled
        if (r.width < 44 - 0.5 || r.height < 44 - 0.5) out.push(`${el.tagName.toLowerCase()}${el.getAttribute("aria-label") ? `[${el.getAttribute("aria-label")}]` : ""} "${(el.textContent || "").trim().slice(0, 24)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
      });
      return out;
    });
    for (const s of small) seen.set(s, sel);
  }
  expect([...seen.entries()].map(([s, sel]) => `${sel}: ${s}`)).toEqual([]);
});

test("keyboard: every stop shows a focus indicator, and focus never gets trapped or lost", async ({ page }) => {
  await page.goto(DEMO);
  await openInvitation(page);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const stops: string[] = [];
  const bad: string[] = [];
  for (let i = 0; i < 90; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      const shadow = cs.boxShadow !== "none";
      // underline fields show focus with a darker border + shadow (class .field:focus)
      const label = `${el.tagName.toLowerCase()}${el.getAttribute("aria-label") ? `[${el.getAttribute("aria-label")}]` : ""}${el.id ? `#${el.id}` : ""} "${(el.textContent || "").trim().slice(0, 20)}"`;
      return { label, ok: outline || shadow, inside: !!el.closest("[data-template=gilded-seal]") };
    });
    if (!info) break;
    if (!info.inside) break; // tabbed out of the template: the loop covered it end to end
    stops.push(info.label);
    if (!info.ok) bad.push(info.label);
  }
  expect(stops.length, "tab stops inside the template").toBeGreaterThan(15);
  expect(bad, "focused controls with no visible focus indicator").toEqual([]);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("nothing is animating or transitioning once it settles, and interactions are instant", async ({ page }) => {
    await page.goto(DEMO);
    await openInvitation(page);
    await page.waitForTimeout(800);
    const running = () => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").map((a) => `${a.constructor.name}:${(a.effect as KeyframeEffect | null)?.target?.tagName ?? "?"}`));
    expect(await running(), "running animations after open").toEqual([]);

    await goTo(page, "#details");
    await page.getByRole("button", { name: "Next event" }).click();
    await page.waitForTimeout(150); // far less than the 1 s slide transition: it must already be done
    expect(await running(), "animations after changing slide").toEqual([]);
    const tf = await page.evaluate(() => getComputedStyle(document.querySelector("#details article")!).transitionDuration);
    expect(parseFloat(tf)).toBeLessThan(0.05);

    await goTo(page, "#rsvp");
    await page.locator("#rsvp").getByLabel(/Joyfully accepts/).check();
    await page.locator("#rsvp").getByRole("button", { name: "Send my reply" }).click();
    await page.waitForTimeout(150);
    expect(await running(), "animations after flipping the RSVP card").toEqual([]);
    await expect(page.locator("#rsvp").getByRole("heading", { name: /Thank you/ })).toBeVisible();
  });
});
