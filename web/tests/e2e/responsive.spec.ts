import { expect, test } from "@playwright/test";
import { fullStack, loginViaUi, seedUser } from "./helpers";

// Runs in the `tablet` (768) and `mobile` (375) projects only (see playwright.config.ts).
// Mobile is an intentional layout, not a scaled desktop: assert structure + no overflow.

const noHorizontalScroll = async (page: import("@playwright/test").Page) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page must not scroll horizontally").toBeLessThanOrEqual(1);
};

test("marketing: header collapses to a menu button on small screens and opens a dialog", async ({ page, viewport }) => {
  await page.goto("/");
  await noHorizontalScroll(page);
  const burger = page.getByRole("button", { name: "Menu" });
  if ((viewport?.width ?? 0) < 1060) {
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden(); // desktop nav hidden
    await burger.click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  }
});

test("marketing: hero shows the headline and a primary CTA without overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("beautiful story");
  await expect(page.getByRole("link", { name: /Create your invitation/ }).first()).toBeVisible();
  await noHorizontalScroll(page);
});

test("auth: showcase panel hides on narrow screens, form stays usable", async ({ page, viewport }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  if ((viewport?.width ?? 0) <= 860) {
    await expect(page.getByText("Every beginning deserves a beautiful story.")).toBeHidden();
  }
  await noHorizontalScroll(page);
});

test.describe("signed-in surfaces", () => {
  test.skip(!fullStack, "requires api + postgres (set E2E_FULL_STACK=1)");

  test("dashboard: sidebar becomes a bottom nav on mobile", async ({ page, viewport }) => {
    const u = seedUser({ withEvent: true });
    await loginViaUi(page, u);
    await page.goto("/app/overview");
    await noHorizontalScroll(page);
    if ((viewport?.width ?? 0) <= 1000) {
      await expect(page.getByRole("navigation", { name: "Primary", exact: true })).toBeVisible();
      await expect(page.getByRole("complementary", { name: "Main navigation" })).toBeHidden(); // <aside> sidebar
    } else {
      await expect(page.getByRole("complementary", { name: "Main navigation" })).toBeVisible();
    }
  });

  test("guest list fits the page (table on wide screens, cards on narrow ones)", async ({ page, viewport }) => {
    const u = seedUser({ withEvent: true });
    await loginViaUi(page, u);
    await page.goto("/app/guests");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("coming");
    if ((viewport?.width ?? 0) > 960) await expect(page.getByRole("table")).toBeVisible();
    await noHorizontalScroll(page);
  });

  test("public invitation fits the viewport and the RSVP buttons are tappable (>=44px)", async ({ page }) => {
    const u = seedUser({ withEvent: true });
    await page.goto(`/invite/${u.guest_token}`);
    await noHorizontalScroll(page);
    const btn = page.getByRole("button", { name: "Joyfully accept" });
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
