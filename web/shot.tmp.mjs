import { chromium, devices } from "@playwright/test";
const SP = process.argv[2];
const b = await chromium.launch();
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await b.newContext(w < 500 ? { ...devices["Pixel 5"], viewport: { width: w, height: h } } : { viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && !/music/.test(m.location().url) && errs.push(m.text().slice(0, 160)));
  await p.goto("http://localhost:3000/demo/we-do?to=Sarah", { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `${SP}/n-cover-${w}.png` });
  const t0 = Date.now();
  await p.getByRole("button", { name: "Open Invitation" }).click();
  console.log("click waited", Date.now() - t0, "ms");
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${SP}/n-opening-${w}.png` });
  await p.waitForTimeout(3800);
  await p.screenshot({ path: `${SP}/n-hero-${w}.png` });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += h / 2) { await p.evaluate((d) => window.scrollBy(0, d), h / 2); await p.waitForTimeout(150); }
  await p.waitForTimeout(1500);
  console.log(w, "overflow", await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), "errors", errs);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${SP}/n-full-${w}.png`, fullPage: true });
  await ctx.close();
}
await b.close();
