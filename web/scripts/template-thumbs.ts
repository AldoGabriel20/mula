// Template thumbnails (docs/17 §7.5, TK-042): for every coded, published template with a demo route, open the demo at
// two viewports (reduced motion, so the picture is the same every time), get past the cover, and write
//   catalog/templates/<slug>/thumb.webp          1280×800 hero, scaled to 640 wide
//   catalog/templates/<slug>/thumb-mobile.webp    390×844 hero, scaled to 260 wide
// plus a copy under web/public/templates/<slug>/ (what the web app serves; the catalog API returns /templates/<slug>/<thumbnail>).
// Run against a running build:  E2E_WEB_URL=http://localhost:3100 npm run templates:thumbs
// Re-running gives the same picture; the bytes can differ by about a kilobyte (encoder, a frame of the entrance), so
// regenerate only when the template's look changed. Needs Node 22.18+ (runs the .ts directly, erasable syntax only) and the Playwright chromium (`npm run test:e2e:install`).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const WEB = process.env.E2E_WEB_URL ?? "http://localhost:3000";
const ROOT = path.resolve(import.meta.dirname, "../..");
const MAX_BYTES = 60 * 1024;
const SHOTS = [
  { file: "thumb.webp", width: 1280, height: 800, out: 640, mobile: false },
  { file: "thumb-mobile.webp", width: 390, height: 844, out: 260, mobile: true },
] as const;

type Manifest = { slug: string; kind: string; status: string; marketing: { demo?: { route: string } } };

const manifests: Manifest[] = fs
  .readdirSync(path.join(ROOT, "catalog/templates"))
  .map((d) => JSON.parse(fs.readFileSync(path.join(ROOT, "catalog/templates", d, "manifest.json"), "utf8")) as Manifest)
  .filter((m) => m.kind === "coded" && m.status === "published" && m.marketing.demo);

const only = process.argv[2];
const browser = await chromium.launch();
try {
  for (const m of manifests.filter((x) => !only || x.slug === only)) {
    for (const shot of SHOTS) {
      const ctx = await browser.newContext({ viewport: { width: shot.width, height: shot.height }, reducedMotion: "reduce", deviceScaleFactor: 1, hasTouch: shot.mobile, isMobile: shot.mobile });
      const page = await ctx.newPage();
      await page.goto(`${WEB}${m.marketing.demo!.route}?to=Our%20Beloved%20Guest`, { waitUntil: "load" });
      await page.getByRole("status", { name: "Preparing your invitation" }).waitFor({ state: "hidden", timeout: 45_000 });
      if (await page.getByRole("button", { name: "Open Invitation" }).count()) {
        await page.getByRole("button", { name: "Open Invitation" }).click();
        await page.getByRole("dialog").first().waitFor({ state: "hidden", timeout: 30_000 });
      }
      await page.waitForTimeout(2500); // entrance settles
      const png = (await page.screenshot({ type: "png" })).toString("base64");
      // encode in the page: canvas.toBlob("image/webp") needs no extra dependency; lower the quality until it fits
      const webp = await page.evaluate(
        async ({ png, out, max }) => {
          const img = new Image();
          img.src = `data:image/png;base64,${png}`;
          await img.decode();
          const cv = document.createElement("canvas");
          cv.width = out;
          cv.height = Math.round((img.naturalHeight * out) / img.naturalWidth);
          cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
          for (let q = 0.85; q >= 0.3; q -= 0.1) {
            const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), "image/webp", q));
            if (blob.size <= max || q < 0.35) {
              const buf = new Uint8Array(await blob.arrayBuffer());
              let s = "";
              for (const b of buf) s += String.fromCharCode(b);
              return { b64: btoa(s), size: blob.size, q };
            }
          }
          throw new Error("unreachable");
        },
        { png, out: shot.out, max: MAX_BYTES },
      );
      const bytes = Buffer.from(webp.b64, "base64");
      if (bytes.length > MAX_BYTES) throw new Error(`${m.slug}/${shot.file}: ${bytes.length} bytes, over ${MAX_BYTES}`);
      for (const dir of [path.join(ROOT, "catalog/templates", m.slug), path.join(ROOT, "web/public/templates", m.slug)]) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, shot.file), bytes);
      }
      console.log(`${m.slug}/${shot.file}  ${(bytes.length / 1024).toFixed(1)} KB (q ${webp.q.toFixed(2)})`);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
