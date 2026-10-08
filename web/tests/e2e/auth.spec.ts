import { expect, test } from "@playwright/test";
import { fullStack, loginViaUi, seedUser } from "./helpers";

// Pure frontend: client-side validation blocks the submit, so no API is involved.
test("login shows inline validation errors without calling the API", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter a valid email")).toBeVisible();
  await expect(page.getByText("Enter your password")).toBeVisible();
});

// Everything below needs the API + Postgres (CI starts both); skipped unless E2E_FULL_STACK=1.
test.describe("with the full stack", () => {
test.skip(!fullStack, "requires api + postgres (set E2E_FULL_STACK=1)");

test("register → lands on the verify notice", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Your name").fill("New Host");
  await page.getByLabel("Email").fill(`reg-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("supersecret1");
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify/);
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
});

test("register with a taken email shows the server error", async ({ page }) => {
  const u = seedUser();
  await page.goto("/register");
  await page.getByLabel("Your name").fill("Dup");
  await page.getByLabel("Email").fill(u.email);
  await page.getByLabel("Password").fill("supersecret1");
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert").first()).toContainText("already registered");
});

test("wrong password is a generic error; right password reaches the app", async ({ page }) => {
  const u = seedUser();
  await page.goto("/login");
  await page.getByLabel("Email").fill(u.email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").first()).toContainText("Invalid email or password");
  await expect(page).toHaveURL(/\/login/);

  await loginViaUi(page, u);
  await expect(page).toHaveURL(/\/app/);
});

test("logout ends the session: /app redirects back to /login", async ({ page }) => {
  const u = seedUser({ withEvent: true }); // without an event the onboarding overlay covers the menu
  await loginViaUi(page, u);
  await expect(page).toHaveURL(/\/app/);
  await page.getByRole("button", { name: "Profile menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/app/overview");
  await expect(page).toHaveURL(/\/login/);
});

test("unauthorized: visiting /app/* logged out redirects to /login", async ({ page }) => {
  for (const p of ["/app", "/app/overview", "/app/guests", "/app/design", "/app/settings"]) {
    await page.goto(p);
    await expect(page, `${p} must be gated`).toHaveURL(/\/login/);
  }
});
});
