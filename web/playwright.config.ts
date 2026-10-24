import { defineConfig, devices } from "@playwright/test";

const WEB = process.env.E2E_WEB_URL ?? "http://localhost:3000";
const FULL = process.env.E2E_FULL_STACK === "1";

// Critical flows run on desktop Chromium. The responsive project re-runs only the layout
// specs at tablet + mobile widths (mobile is an intentional layout, not a scaled desktop).
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // The Gilded Seal page is deliberately heavy (3D transforms, blur, shaders): too many browsers at once starve each other
  // and turn timing into flakes. 4 locally, 2 on the small CI runners.
  workers: process.env.CI ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: WEB,
    trace: "on-first-retry",
    // The signed-in dashboard fires background polling; avoid flakiness from idle network.
    actionTimeout: 10_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } }, testIgnore: /responsive/ },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } }, testMatch: /responsive|gilded-seal|template-contract/ },
    { name: "mobile", use: { ...devices["Pixel 5"], viewport: { width: 375, height: 800 } }, testMatch: /responsive|gilded-seal|template-contract/ },
  ],
  // The full-stack specs need the API + Postgres up (CI starts them); only the web server is
  // managed here. E2E_FULL_STACK=1 enables the specs that need the API.
  webServer: FULL
    ? { command: "npm run build && npm run start", url: WEB, reuseExistingServer: !process.env.CI, timeout: 180_000 }
    : { command: "npm run dev", url: WEB, reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
