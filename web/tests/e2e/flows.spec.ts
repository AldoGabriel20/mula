import { expect, test } from "@playwright/test";
import { fullStack, loginViaUi, seedUser } from "./helpers";

test.skip(!fullStack, "requires api + postgres (set E2E_FULL_STACK=1)");

test("create invitation: /app with no celebration → onboarding → overview", async ({ page }) => {
  const u = seedUser(); // verified, no event
  await loginViaUi(page, u);
  // no events yet → /app routes to onboarding
  await expect(page).toHaveURL(/\/app\/onboarding/);

  const dialog = page.getByRole("dialog", { name: "Create your celebration" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Continue" }).click(); //                         1 type (Wedding default)
  await dialog.getByPlaceholder("e.g. Raden & Cilla").fill("Raden & Cilla"); //             2 hosts
  await dialog.getByRole("button", { name: "Continue" }).click();
  await dialog.getByLabel("Date").fill("2099-06-01"); //                                     3 date
  await dialog.getByRole("button", { name: "Continue" }).click();
  await dialog.getByPlaceholder("Venue name").fill("The Glasshouse"); //                    4 venue
  await dialog.getByRole("button", { name: "Continue" }).click();
  await dialog.getByRole("button", { name: "Continue" }).click(); //                         5 design
  await dialog.getByPlaceholder(/Guest/).fill("Dewi"); //                                    6 guests
  await dialog.getByPlaceholder(/Guest/).press("Enter");
  await dialog.getByRole("button", { name: "Continue" }).click();
  await dialog.getByRole("button", { name: "Looks right" }).click(); //                      7 review
  await dialog.getByRole("button", { name: "Publish invitation" }).click(); //               8 publish

  await expect(page).toHaveURL(/\/app\/overview/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toContainText("Raden");
  // the new celebration is the current one in the switcher
  await expect(page.getByRole("button", { name: "Switch celebration" })).toContainText("Raden & Cilla");
});

test("hide a section, reload → persisted; hiding a required one blocks publishing", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await page.goto("/app/invitations/edit");
  const toggle = page.getByRole("switch", { name: "Show this section" });

  await page.getByRole("button", { name: /Story/ }).click(); // optional section
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await page.reload(); // "save" = the server persisted it, not just client state
  await page.getByRole("button", { name: /Story/ }).click();
  await expect(page.getByRole("switch", { name: "Show this section" })).toHaveAttribute("aria-checked", "false");

  // required sections: unpublish (seeded event is published), hide RSVP through the API, try to publish
  await page.goto("/app/invitations");
  await page.getByRole("button", { name: "Unpublish" }).first().click();
  const csrf = (await page.context().cookies()).find((c) => c.name === "csrf_token")?.value ?? "";
  const inv = await (await page.request.get(`/api/v1/events/${u.event_id}/invitation`)).json();
  const rsvp = inv.sections.find((s: { type: string }) => s.type === "rsvp");
  await page.request.patch(`/api/v1/events/${u.event_id}/invitation/sections/${rsvp.id}`, { data: { visible: false }, headers: { "X-CSRF-Token": csrf } });
  await page.reload();
  await page.getByRole("button", { name: "Publish", exact: true }).first().click();
  await expect(page.getByRole("status")).toContainText("rsvp");
});

test("host preview opens with the couple's names", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await page.goto("/app/overview");
  await page.getByRole("button", { name: "Preview invitation" }).click();
  const preview = page.getByRole("dialog", { name: "Invitation preview" });
  await expect(preview).toBeVisible();
  await expect(preview).toContainText("Cilla");
});

test("public invitation + guest RSVP updates the host", async ({ page, browser }) => {
  const u = seedUser({ withEvent: true });

  // the guest has no session: use a clean context
  const guest = await browser.newContext();
  const g = await guest.newPage();
  await g.goto(`/invite/${u.guest_token}`);
  await expect(g.getByText("Dear E2E Guest,")).toBeVisible();
  await expect(g.getByRole("heading", { name: "Aldo & Cilla" })).toBeVisible();
  await g.getByRole("button", { name: "Joyfully accept" }).click();
  await expect(g.getByText("See you there, E2E Guest.")).toBeVisible();

  // wish
  await g.getByLabel("Your message").fill("Congratulations!");
  await g.getByRole("button", { name: "Send wish" }).click();
  await expect(g.getByText("your wish is on its way")).toBeVisible();
  await guest.close();

  // host sees the reply
  await loginViaUi(page, u);
  await page.goto("/app/guests");
  const row = page.getByRole("row", { name: /E2E Guest/ });
  await expect(row).toContainText("Attending");
});

test("invalid resource: unknown or revoked invitation token → 404 page", async ({ page }) => {
  const resp = await page.goto("/invite/this-token-does-not-exist");
  expect(resp?.status()).toBe(404);
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await page.goto("/app/invitations");
  await page.getByRole("button", { name: "Unpublish" }).first().click();
  await expect(page.getByRole("button", { name: "Publish", exact: true }).first()).toBeVisible();
  const r2 = await page.goto(`/invite/${u.guest_token}`); // personal link dies with unpublish
  expect(r2?.status()).toBe(404);
});

test("invalid resource: another user's event id is not readable (API 404, no data)", async ({ page, request }) => {
  const a = seedUser({ withEvent: true });
  const b = seedUser();
  await loginViaUi(page, b);
  const res = await page.request.get(`/api/v1/events/${a.event_id}`);
  expect(res.status()).toBe(404);
  expect(await res.text()).not.toContain("Aldo");
  void request;
});

test("dashboard pages render real data for a seeded event (smoke)", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  for (const [path, heading] of [
    ["/app/overview", /Aldo/],
    ["/app/guests", /coming/],
    ["/app/tasks", /done/],
    ["/app/schedule", /moments/],
    ["/app/gift", /celebrate/],
    ["/app/memories", /guests are saying/],
    ["/app/billing", /package and payments/],
    ["/app/settings", /.+/],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first(), path).toContainText(heading);
  }
});
