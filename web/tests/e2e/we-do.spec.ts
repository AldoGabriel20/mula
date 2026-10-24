import { expect } from "@playwright/test";
import { fullStack, gsTest as test, loginViaUi, seedUser, selectTemplate } from "./helpers";

// The We Do template end to end: chosen from the dashboard's Design page, themed, published and answered by a guest.
// (The generic contract — axe, 44 px targets, focus, reduced motion, no overflow — runs for it in template-contract.spec.ts.)
test.skip(!fullStack, "requires api + postgres (set E2E_FULL_STACK=1)");
test.describe.configure({ timeout: 120_000 });

test("Design: We Do is in the catalog with its own thumbnail and two font pairings", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await page.goto("/app/design");
  const card = page.locator("article.dcard", { hasText: "We Do" });
  await expect(card.locator("img[alt='We Do preview']")).toBeVisible();
  await card.getByRole("button", { name: "Use this design" }).click();
  await expect.poll(async () => (await (await page.request.get(`/api/v1/events/${u.event_id}/invitation`)).json()).template_id !== null).toBe(true);
  await page.reload();
  const panel = page.locator("[data-theme-panel]");
  await expect(panel.getByRole("button", { name: "Noir & Gold" })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Midnight & Gold" })).toHaveCount(0);
  await expect(panel.locator("[data-theme-pairing]")).toBeVisible(); // two pairings = a real choice
});

test("a guest opens the personal link, replies and leaves a wish; the page wears the host's palette and fonts", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await selectTemplate(page, u.event_id!, "we-do");
  const csrf = (await page.context().cookies()).find((c) => c.name === "csrf_token")?.value ?? "";
  const res = await page.request.patch(`/api/v1/events/${u.event_id}/invitation`, { data: { theme: { palette: "stone-linen", fontPairing: "classic-serif" } }, headers: { "X-CSRF-Token": csrf } });
  expect(res.status()).toBe(200);
  await page.request.post(`/api/v1/events/${u.event_id}/invitation/publish`, { headers: { "X-CSRF-Token": csrf } });

  await page.goto(`/invite/${u.guest_token}`);
  await expect(page.locator('[data-template="we-do"]')).toBeAttached({ timeout: 45_000 });
  const vars = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector("[data-kit-root]")!);
    return { bg: cs.getPropertyValue("--k-bg").trim(), display: cs.getPropertyValue("--k-font-display").trim() };
  });
  expect(vars.bg).toBe("#F1EFEA");
  expect(vars.display).toContain("Cormorant Garamond");

  const rsvp = page.locator("#rsvp");
  await rsvp.scrollIntoViewIfNeeded();
  await rsvp.getByLabel(/Joyfully accept/).check();
  await rsvp.getByRole("button", { name: "Send", exact: true }).click();
  await expect(rsvp.getByText(/Thank you/)).toBeVisible();
  await page.reload(); // the reply is stored: the form comes back already answered
  await expect(page.locator("#rsvp").getByText(/Thank you/)).toBeVisible({ timeout: 45_000 });

  const wishes = page.locator("#wishes");
  await wishes.scrollIntoViewIfNeeded();
  await wishes.getByLabel("Your wish").fill("Selamat menempuh hidup baru!");
  await wishes.getByRole("button", { name: "Send wish" }).click();
  await expect(wishes.getByText(/shared with the couple/)).toBeVisible();
  await expect(wishes.getByText(/Selamat menempuh/)).toBeVisible();
});

test("the landing lists We Do with its real thumbnail and a live demo", async ({ page }) => {
  await page.goto("/templates");
  await expect(page.locator("img[alt='We Do preview']").first()).toBeVisible();
  await page.goto("/templates/we-do");
  await expect(page.locator("img[alt='We Do preview']").first()).toBeVisible();
  const [demo] = await Promise.all([page.waitForEvent("popup"), page.getByRole("button", { name: "Preview invitation" }).click()]);
  expect(new URL(demo.url()).pathname).toBe("/demo/we-do");
});
