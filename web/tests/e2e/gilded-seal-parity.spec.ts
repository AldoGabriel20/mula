import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";

// GS-062: captures the production template and the original prototype side by side at three viewports so the
// two can be compared by eye. Not part of the normal run: GS_PARITY=1 npx playwright test gilded-seal-parity
// Output: test-results/gilded-seal-parity/<viewport>/<shot>-{app,proto}.png and an index.html that lays them out.
test.skip(process.env.GS_PARITY !== "1", "visual parity capture (set GS_PARITY=1)");
test.describe.configure({ timeout: 240_000 });
test.use({ actionTimeout: 30_000 });

const PROTO = pathToFileURL(path.resolve(__dirname, "../../../docs/mula-sample-template-prototype/Mula Wedding Invitation v3.dc.html")).href;
const OUT = path.resolve(__dirname, "../../test-results/gilded-seal-parity");
const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900, touch: false },
  { name: "768x1024", width: 768, height: 1024, touch: true },
  { name: "390x844", width: 390, height: 844, touch: true },
];
const SHOTS = ["cover", "opening", "hero", "statement", "story", "date", "details", "venue", "gallery", "gift", "rsvp-front", "rsvp-back", "wishes", "closing"];

// the sandbox browser has no GPU: present one, so both pages take their 3D path (software GL is rendered, just slowly)
const fakeGpu = () => {
  const patch = (proto: { getParameter: (p: number) => unknown }) => {
    const o = proto.getParameter;
    proto.getParameter = function (this: unknown, p: number) {
      return p === 0x9246 ? "ANGLE (Fake GPU)" : o.call(this, p);
    };
  };
  patch(WebGLRenderingContext.prototype as never);
  if (window.WebGL2RenderingContext) patch(WebGL2RenderingContext.prototype as never);
};

async function capture(page: Page, dir: string, side: "app" | "proto") {
  const shot = async (name: string) => page.screenshot({ path: path.join(dir, `${name}-${side}.png`) });
  const go = async (sel: string, extra = 0) => {
    const found = await page.evaluate(([s, e]) => {
      const el = document.querySelector(s as string);
      if (!el) return false;
      scrollTo(0, el.getBoundingClientRect().top + scrollY + (e as number));
      return true;
    }, [sel, extra] as const);
    await page.waitForTimeout(found ? 2600 : 0);
    return found;
  };
  await expect(page.getByRole("status", { name: "Preparing your invitation" })).toBeHidden({ timeout: 60_000 });
  await page.waitForTimeout(2500);
  await shot("cover");
  await page.getByRole("button", { name: "Open Invitation" }).click();
  await page.waitForTimeout(2300);
  await shot("opening");
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 60_000 });
  await page.waitForTimeout(5200);
  await shot("hero");
  for (const [name, sel, extra] of [["statement", "#statement", 0], ["story", "#story", 0], ["date", "#date", 0], ["details", "#details", 0], ["venue", "#venue", 0]] as const) {
    if (await go(sel, extra)) await shot(name);
  }
  if (await go("#gallery", 1700)) await shot("gallery");
  if (await go("#gift")) await shot("gift");
  if (await go("#rsvp")) {
    await shot("rsvp-front");
    const rsvp = page.locator("#rsvp");
    await rsvp.locator("input[type=text]").first().fill("Sarah");
    await rsvp.getByText("Joyfully accepts").click();
    await rsvp.locator("button[type=submit]").click();
    await page.waitForTimeout(2200);
    await shot("rsvp-back");
  }
  if (await go("#wishes")) await shot("wishes");
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3200);
  await shot("closing");
}

for (const vp of VIEWPORTS) {
  for (const side of ["app", "proto"] as const) {
    test(`${vp.name} ${side}`, async ({ browser }) => {
      const dir = path.join(OUT, vp.name);
      fs.mkdirSync(dir, { recursive: true });
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.touch, isMobile: vp.width < 600 });
      await ctx.addInitScript(fakeGpu);
      const page = await ctx.newPage();
      await page.goto(side === "app" ? "/demo/gilded-seal" : PROTO, { waitUntil: "load" });
      await capture(page, dir, side);
      await ctx.close();
    });
  }
}

test.afterAll(() => {
  // a plain page that lays the pairs out for review
  const rows = VIEWPORTS.map((vp) => {
    const cells = SHOTS.map((s) => `<tr><td colspan="2"><b>${s}</b></td></tr><tr>${(["app", "proto"] as const).map((side) => `<td><img loading="lazy" src="${vp.name}/${s}-${side}.png" alt="${s} ${side}" width="${vp.width > 800 ? 700 : 380}"></td>`).join("")}</tr>`).join("");
    return `<h2>${vp.name}</h2><table><tr><th>production</th><th>prototype</th></tr>${cells}</table>`;
  }).join("");
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><title>Gilded Seal parity</title><style>body{font:14px system-ui;margin:20px}td{vertical-align:top;padding:4px}img{border:1px solid #ccc}</style>${rows}`);
});
