import { execFileSync } from "node:child_process";
import path from "node:path";
import type { Page } from "@playwright/test";

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
