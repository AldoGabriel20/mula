import { chromium, devices } from "@playwright/test";
const [SP, W = "390", H = "844"] = process.argv.slice(2);
const w = +W, h = +H;
const b = await chromium.launch();
const ctx = await b.newContext(w < 500 ? { ...devices["Pixel 5"], viewport: { width: w, height: h } } : { viewport: { width: w, height: h } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://localhost:3000/demo/we-do?to=Sarah", { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
await p.screenshot({ path: `${SP}/${w}-0cover.png` });
await p.getByRole("button", { name: "Open Invitation" }).click();
for (const t of [400, 900, 1500, 2200]) { await p.waitForTimeout(t === 400 ? 400 : t === 900 ? 500 : t === 1500 ? 600 : 700); await p.screenshot({ path: `${SP}/${w}-1open-${t}.png` }); }
await p.waitForTimeout(3500);
await p.screenshot({ path: `${SP}/${w}-2hero.png` });
for (const id of ["music", "countdown", "venue", "day", "details", "gallery", "gift", "rsvp", "wishes", "closing"]) {
  const ok = await p.evaluate((id) => { const el = document.getElementById(id); if (!el) return false; el.scrollIntoView(); return true; }, id);
  if (!ok) continue;
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `${SP}/${w}-${id}.png` });
}
console.log(w, "overflow", await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), "errors", errs);
await b.close();
