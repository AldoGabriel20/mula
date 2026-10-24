import { execFileSync } from "node:child_process";
import path from "node:path";
import { test as base, expect, type Page } from "@playwright/test";

export type E2EUser = { email: string; password: string; event_id?: string; guest_token?: string };

// Creates a VERIFIED user (and optionally a published event + one guest with a personal link)
// by running `go run ./cmd/seed e2e-user …` against the same database the API uses. This goes
// through the real services; the API exposes no test-only endpoint.
// CI can set E2E_SEED_BIN to a prebuilt seed binary to skip `go run` compile time.
export function seedUser(opts: { withEvent?: boolean } = {}): E2EUser {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const args = ["e2e-user", email, ...(opts.withEvent ? ["--with-event"] : [])];
  const apiDir = path.resolve(__dirname, "../../../api");
  const out = process.env.E2E_SEED_BIN
    ? execFileSync(process.env.E2E_SEED_BIN, args, { cwd: apiDir, env: process.env, encoding: "utf8" })
    : execFileSync("go", ["run", "./cmd/seed", ...args], { cwd: apiDir, env: process.env, encoding: "utf8" });
  // `go run` may print build noise before the JSON line; take the last JSON object.
  const line = out.trim().split("\n").reverse().find((l) => l.startsWith("{"));
  if (!line) throw new Error(`seed produced no JSON: ${out}`);
  return JSON.parse(line) as E2EUser;
}

/** Log in through the real login form (also exercises cookies + CSRF cookie issuance). */
export async function loginViaUi(page: Page, u: Pick<E2EUser, "email" | "password">) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(u.email);
  await page.getByLabel("Password").fill(u.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app/); // the session cookie is set before we navigate on
}

export const fullStack = process.env.E2E_FULL_STACK === "1";

// ---- Gilded Seal ---------------------------------------------------------------------------

/** `test` that fails when the page logs a console error (hydration, a thrown handler, a bad request…). */
export const gsTest = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      // the licensed music files are a product asset: a missing one is expected to 404 and is handled in the UI
      if (/\/templates\/[^/]+\/music\//.test(m.location().url)) return;
      // the login page probes /me while signed out: a 401 there is the answer, not a bug
      if (/\/api\/v1\/me$/.test(m.location().url)) return;
      errors.push(m.text().slice(0, 300));
    });
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 300)}`));
    await use(page);
    expect(errors, "console errors").toEqual([]);
  },
});

/** Pick a catalog template for the signed-in user's event through the real API (adds the template's sections). */
export async function selectTemplate(page: Page, eventId: string, slug: string) {
  const csrf = (await page.context().cookies()).find((c) => c.name === "csrf_token")?.value ?? "";
  const cat = await (await page.request.get("/api/v1/templates")).json();
  const t = cat.data.find((x: { slug: string }) => x.slug === slug);
  if (!t) throw new Error(`no template ${slug}`);
  const res = await page.request.patch(`/api/v1/events/${eventId}/invitation`, { data: { template_id: t.id }, headers: { "X-CSRF-Token": csrf } });
  if (!res.ok()) throw new Error(`select template: ${res.status()} ${await res.text()}`);
}

/** The event's generic link token (publishing again keeps the existing one). */
export async function genericToken(page: Page, eventId: string): Promise<string> {
  const csrf = (await page.context().cookies()).find((c) => c.name === "csrf_token")?.value ?? "";
  const res = await page.request.post(`/api/v1/events/${eventId}/invitation/publish`, { headers: { "X-CSRF-Token": csrf } });
  return (await res.json()).token as string;
}

/** The cover's Open button exists under the loading veil; it can only be pressed once the veil has gone. */
export async function waitForVeil(page: Page) {
  await expect(page.getByRole("status", { name: "Preparing your invitation" })).toBeHidden({ timeout: 45_000 });
}

/** Wait for the veil to lift and the cover's Open button, then open the invitation. */
export async function openInvitation(page: Page) {
  await waitForVeil(page);
  await page.getByRole("button", { name: "Open Invitation" }).click();
  await expect(page.getByRole("dialog", { name: "Wedding invitation cover" })).toBeHidden({ timeout: 30_000 });
}

/** Scroll a section into view and give its reveals a moment. */
export async function goTo(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.evaluate((s) => document.querySelector(s)!.scrollIntoView(), selector);
  await page.waitForTimeout(700);
}
