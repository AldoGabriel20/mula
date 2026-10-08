import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { fullStack, loginViaUi, seedUser } from "./helpers";

// Fail on critical/serious violations only (strategy: "no critical violations"). Minor
// findings are reported but don't gate, so the suite stays actionable.
async function expectNoSeriousViolations(page: import("@playwright/test").Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(
    bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`),
    `${label}: axe critical/serious violations`,
  ).toEqual([]);
}

test.describe("public pages", () => {
  for (const path of ["/", "/login", "/register", "/pricing", "/features", "/contact"]) {
    test(`${path} has no critical a11y violations`, async ({ page }) => {
      await page.goto(path);
      await expectNoSeriousViolations(page, path);
    });
  }

  test("keyboard: skip link is the first tab stop and moves focus to main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("visible focus ring on interactive controls", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThan(0);
  });

  test("reduced motion: the grain overlay animates normally and is static when reduced", async ({ browser }) => {
    const animationOf = async (reducedMotion: "reduce" | "no-preference") => {
      const ctx = await browser.newContext({ reducedMotion });
      const page = await ctx.newPage();
      await page.goto("/");
      const grain = page.getByTestId("grain");
      await expect(grain, "grain overlay must exist (otherwise this test proves nothing)").toHaveCount(1);
      const name = await grain.evaluate((el) => getComputedStyle(el).animationName);
      await ctx.close();
      return name;
    };
    expect(await animationOf("no-preference")).not.toBe("none"); // animates by default
    expect(await animationOf("reduce")).toBe("none"); //            …and stops when the user asks
  });
});

test.describe("signed-in + guest pages", () => {
  test.skip(!fullStack, "requires api + postgres (set E2E_FULL_STACK=1)");

  test("dashboard overview / design / guests have no critical violations", async ({ page }) => {
    const u = seedUser({ withEvent: true });
    await loginViaUi(page, u);
    // the dashboard staggers its content in; axe must measure the settled colours, not a frame mid-fade
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const p of ["/app/overview", "/app/design", "/app/guests"]) {
      await page.goto(p);
      await page.getByRole("heading").first().waitFor();
      await expectNoSeriousViolations(page, p);
    }
  });

  test("public invitation has no critical violations", async ({ page }) => {
    const u = seedUser({ withEvent: true });
    await page.goto(`/invite/${u.guest_token}`);
    await expectNoSeriousViolations(page, "public invitation");
  });
});
