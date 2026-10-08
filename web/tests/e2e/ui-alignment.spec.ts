import { expect, test, type Page } from "@playwright/test";
import { fullStack, loginViaUi, seedUser } from "./helpers";

// Real browser → Next proxy → Go API → Postgres. Covers the dashboard flows that were wired to the
// APIs added in migration 0014 (docs/api-change-plan.md). Needs the full stack, like flows.spec.ts.
test.skip(!fullStack, "needs the API + database (E2E_FULL_STACK=1)");

/** Same-origin API call with the session + CSRF the dashboard itself uses. */
async function api(page: Page, method: string, url: string, data?: unknown) {
  const csrf = (await page.context().cookies()).find((c) => c.name === "csrf_token")?.value ?? "";
  const res = await page.request.fetch(url, { method, data, headers: { "X-CSRF-Token": csrf } });
  return { status: res.status(), body: res.status() === 204 ? null : await res.json().catch(() => null) };
}

test("schedule: details entered in the dashboard are saved by the API and survive a reload", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await page.goto("/app/schedule");
  await page.getByRole("button", { name: "Add a moment" }).first().click();
  await expect(page.getByText("New moment").first()).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).first().click();
  await page.locator('[data-f="address"]').fill("Jl. Jend. Sudirman 5");
  await page.locator('[data-f="dress"]').fill("Black tie optional");
  await page.locator('[data-f="desc"]').fill("Dinner and toasts");
  await page.locator('[data-f="vis"]').selectOption("Invite only");
  await page.getByRole("button", { name: "Save moment" }).click();
  await expect(page.getByText("Moment saved.")).toBeVisible();

  const { body } = await api(page, "GET", `/api/v1/events/${u.event_id}/schedule`);
  expect(body.data[0]).toMatchObject({ address: "Jl. Jend. Sudirman 5", dress_code: "Black tie optional", description: "Dinner and toasts", visibility: "invite_only" });
  await page.reload();
  await expect(page.getByText("Black tie optional").first()).toBeVisible();
});

test("guests: notes are saved, resend emails the personal link and stamps invited_at", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  const list = await api(page, "GET", `/api/v1/events/${u.event_id}/guests`);
  const g = list.body.data[0];
  await api(page, "PATCH", `/api/v1/events/${u.event_id}/guests/${g.id}`, { email: "guest@example.com" });

  await page.goto("/app/guests");
  await page.getByText("E2E Guest").first().click();
  await page.locator('aside [data-f="notes"]').fill("Vegetarian, seat near the front");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Guest notes saved.")).toBeVisible();
  await page.getByRole("button", { name: "Resend invitation" }).click();
  await expect(page.getByText(/Invitation sent again to E2E/)).toBeVisible();

  const after = await api(page, "GET", `/api/v1/events/${u.event_id}/guests/${g.id}`);
  expect(after.body.notes).toBe("Vegetarian, seat near the front");
  expect(after.body.invited_at).toBeTruthy();
});

test("gift methods: added in the dashboard, shown (with copy) on the public invitation", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await page.goto("/app/gift");
  await page.getByRole("button", { name: "Add gift method" }).first().click();
  await expect(page.getByText("New gift method").first()).toBeVisible();
  const m = await api(page, "GET", `/api/v1/events/${u.event_id}/gift-methods`);
  expect(m.body.data).toHaveLength(1);
  await api(page, "PATCH", `/api/v1/events/${u.event_id}/gift-methods/${m.body.data[0].id}`, { title: "BCA · Raka", copy_value: "8830 1122 45" });

  await page.goto("/app/gift");
  await expect(page.getByRole("heading", { name: "BCA · Raka" })).toBeVisible();

  const guest = await page.context().newPage();
  await guest.goto(`/invite/${u.guest_token}`);
  await expect(guest.getByText("BCA · Raka")).toBeVisible();
  await expect(guest.getByRole("button", { name: "Copy" })).toBeVisible();
});

test("team: an invite by email appears as invited and the owner is listed", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await page.goto("/app/team");
  await page.getByLabel("Invite someone").fill("cilla@example.com");
  await page.getByLabel("Role").selectOption("Planner");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(page.getByText("Invitation to collaborate sent.")).toBeVisible();
  await expect(page.getByText(/cilla@example.com · Invited/)).toBeVisible();
  const m = await api(page, "GET", `/api/v1/events/${u.event_id}/members`);
  expect(m.body.data.map((x: any) => `${x.role}:${x.status}`).sort()).toEqual(["owner:active", "planner:invited"]);
});

test("settings: phone is saved and a second device can be signed out", async ({ page, browser }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  // a second browser session for the same account
  const other = await browser.newContext();
  const op = await other.newPage();
  await loginViaUi(op, u);

  await page.goto("/app/settings");
  await page.locator('[data-profile] [data-f="phone"]').fill("+62 812 3456 7890");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Your profile is saved.")).toBeVisible();
  expect((await api(page, "GET", "/api/v1/me")).body.phone).toBe("+62 812 3456 7890");

  await page.reload();
  await expect(page.getByText("This device")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page.getByText("That device was signed out.")).toBeVisible();
  expect((await other.request.get("/api/v1/me")).status()).toBe(401);
  await other.close();
});

test("add-ons: an order is created from the cart for the server-side price", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await page.goto("/app/addons");
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await page.getByRole("button", { name: /^Cart/ }).click(); // client-side: the cart lives in the page state
  await page.getByRole("button", { name: /^Pay/ }).click();
  await expect.poll(async () => ((await api(page, "GET", "/api/v1/billing/invoices")).body.data ?? []).length).toBeGreaterThan(0);
  const sub = await api(page, "GET", "/api/v1/billing/subscription");
  expect(sub.body.addons.length).toBeGreaterThan(0);
  expect(sub.body.addons[0].status).toBe("pending"); // active only after the signed payment webhook
});
