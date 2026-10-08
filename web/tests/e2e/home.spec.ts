import { test, expect } from "@playwright/test";

// Home renders. data-theme is set only for an explicit choice (system = attribute absent), so the
// check is that the page paints with content, not that the attribute exists.
test("home renders", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
});
