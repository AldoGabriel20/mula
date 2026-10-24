import { expect, test } from "@playwright/test";
import { fullStack, loginViaUi, seedUser, selectTemplate } from "./helpers";

// TK-040/041/043: the Design page reads the catalog by slug, offers only what the manifest lets a host change, and what
// is saved shows on the host's draft preview as theme variables. The landing shows the real template thumbnail.
test.skip(!fullStack, "requires api + postgres (set E2E_FULL_STACK=1)");
test.describe.configure({ timeout: 90_000 });

test("Design: pick Gilded Seal from the catalog, theme it, see it on the draft preview, reset", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await page.goto("/app/design");

  // the cards are the catalog, matched by slug: choosing Gilded Seal persists the template
  const card = page.locator("article.dcard", { hasText: "Gilded Seal" });
  await expect(card.locator("img[alt='Gilded Seal preview']")).toBeVisible(); // the real thumbnail, not the mock
  await card.getByRole("button", { name: "Use this design" }).click();
  await expect.poll(async () => {
    const inv = await (await page.request.get(`/api/v1/events/${u.event_id}/invitation`)).json();
    return inv.template_id !== null;
  }).toBe(true);
  await page.reload();

  // the panel offers the manifest's choices only
  const panel = page.locator("[data-theme-panel]");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Rose & Linen" })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Midnight & Gold" })).toHaveCount(0); // not listed for this design
  await expect(panel.locator("[data-theme-token=accent]")).toBeVisible();
  await expect(panel.locator("[data-theme-pairing]")).toHaveCount(0); // a single pairing is no choice

  // an unreadable accent warns and cannot be saved
  await panel.locator("[data-theme-token=accent]").fill("#101010");
  await expect(panel.locator("[data-theme-warning]")).toContainText("too faint");
  await expect(panel.locator("[data-theme-save]")).toBeDisabled();

  // a good theme saves
  await panel.getByRole("button", { name: "Rose & Linen" }).click();
  await panel.locator("[data-theme-token=accent]").fill("#c9a27a");
  await panel.getByRole("button", { name: "Calm" }).click();
  await panel.locator("[data-theme-save]").click();
  await expect.poll(async () => (await (await page.request.get(`/api/v1/events/${u.event_id}/invitation`)).json()).theme).toMatchObject({ palette: "rose-linen", motion: "calm", tokens: { accent: "#C9A27A" } });

  // the host's draft preview wears it: theme variables on the kit root
  const prev = await page.context().newPage();
  await prev.goto(`/preview/${u.event_id}`);
  await expect(prev.locator("[data-kit-root]")).toBeAttached({ timeout: 30_000 });
  const vars = async () =>
    prev.evaluate(() => {
      const el = document.querySelector("[data-kit-root]") as HTMLElement;
      const cs = getComputedStyle(el);
      return { bg: cs.getPropertyValue("--k-bg").trim(), accent: cs.getPropertyValue("--k-accent").trim(), ink: cs.getPropertyValue("--k-ink").trim() };
    });
  await expect.poll(vars).toEqual({ bg: "#F8EDEB", accent: "#C9A27A", ink: "#3A2626" });
  await prev.close();

  // back to the design's own look
  await panel.getByRole("button", { name: /Back to the design/ }).click();
  await expect.poll(async () => (await (await page.request.get(`/api/v1/events/${u.event_id}/invitation`)).json()).theme).toEqual({});
});

test("the guest page carries the theme and the template version", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await selectTemplate(page, u.event_id!, "gilded-seal");
  const csrf = (await page.context().cookies()).find((c) => c.name === "csrf_token")?.value ?? "";
  const res = await page.request.patch(`/api/v1/events/${u.event_id}/invitation`, { data: { theme: { palette: "sage-parchment" } }, headers: { "X-CSRF-Token": csrf } });
  expect(res.status()).toBe(200);
  const pub = await (await page.request.post(`/api/v1/events/${u.event_id}/invitation/publish`, { headers: { "X-CSRF-Token": csrf } })).json();
  const invite = await (await page.request.get(`/api/v1/invite/${pub.token}`)).json();
  expect(invite.theme).toEqual({ palette: "sage-parchment" });
  expect(invite.template_version).toBeGreaterThanOrEqual(1);
  await page.goto(`/invite/${pub.token}`);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector("[data-kit-root]")!).getPropertyValue("--k-bg").trim())).toBe("#F1F2EA");
});

test("the landing shows the real thumbnail for a design with a manifest, and the phone mock for the rest", async ({ page }) => {
  await page.goto("/templates");
  await expect(page.locator("img[alt='Gilded Seal preview']").first()).toBeVisible();
  await page.goto("/templates/gilded-seal");
  await expect(page.locator("img[alt='Gilded Seal preview']").first()).toBeVisible();
  await page.goto("/templates/serenity");
  await expect(page.locator("img[alt='Serenity preview']")).toHaveCount(0);
});
