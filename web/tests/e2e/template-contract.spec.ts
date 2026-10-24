import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { MANIFESTS } from "@/lib/kit/generated/manifests";
import { goTo, gsTest as test, openInvitation, waitForVeil } from "./helpers";

// TK-060 — the template contract suite (docs/17 §16). It iterates every manifest in the catalog that has a coded
// renderer and runs the same checks against its demo route, so a new template gets this coverage with no spec edits.
// What a template must offer to pass: `marketing.demo.route`, a root `[data-template="<slug>"]`, a loading wash and
// an Open button inside a `dialog` when it has a cover, anchors `#id` on its sections, and the `[data-kit-root]`
// wrapper (TemplateHost adds it). Bespoke interactions stay in the template's own spec (gilded-seal*.spec.ts).
test.describe.configure({ timeout: 120_000 });
test.use({ actionTimeout: 20_000 });

const templates = Object.values(MANIFESTS).filter((m) => m.kind === "coded" && m.status === "published" && m.marketing.demo);

/** Open the demo and get past the cover, if it has one (an "Open Invitation" button in a dialog). */
async function enter(page: Page, route: string, slug: string) {
  await page.goto(`${route}?to=Sarah`);
  await expect(page.locator(`[data-template="${slug}"]`)).toBeAttached({ timeout: 45_000 });
  await waitForVeil(page);
  if (await page.getByRole("button", { name: "Open Invitation" }).count()) await openInvitation(page);
}

/** Section anchors the template exposes (ids on <section>), in document order. */
const anchors = (page: Page, slug: string) =>
  page.evaluate((s) => [...document.querySelectorAll(`[data-template="${s}"] section[id]`)].map((e) => "#" + e.id), slug);

for (const m of templates) {
  const slug = m.slug;
  const route = m.marketing.demo!.route;

  test.describe(`contract: ${slug}`, () => {
    test("renders the demo with the kit theme, sends no write, and logs no error", async ({ page }) => {
      const writes: string[] = [];
      page.on("request", (r) => {
        if (!["GET", "HEAD", "OPTIONS"].includes(r.method()) && /\/api\//.test(r.url())) writes.push(`${r.method()} ${r.url()}`);
      });
      await enter(page, route, slug);
      const root = await page.evaluate((s) => {
        const kit = document.querySelector(`[data-kit-root="${s}"]`) as HTMLElement | null;
        const tpl = document.querySelector(`[data-template="${s}"]`) as HTMLElement | null;
        return { kit: !!kit, bg: kit ? getComputedStyle(kit).getPropertyValue("--k-bg").trim() : "", inside: !!kit && !!tpl && kit.contains(tpl), rootHasVars: !document.documentElement.getAttribute("style")?.includes("--k-") };
      }, slug);
      expect(root).toEqual({ kit: true, bg: m.tokens.color.bg, inside: true, rootHasVars: true });
      for (const sel of await anchors(page, slug)) await goTo(page, sel);
      expect(writes, "network writes from a demo").toEqual([]);
    });

    test("no horizontal scroll at 375, 768 and 1280", async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "sweeps the three widths itself");
      for (const w of [375, 768, 1280]) {
        await page.setViewportSize({ width: w, height: 800 });
        await enter(page, route, slug);
        for (const sel of await anchors(page, slug)) {
          await goTo(page, sel);
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `overflow at ${sel}, ${w}px`).toBeLessThanOrEqual(1);
        }
      }
    });

    test("axe: no serious or critical violations once open", async ({ page }) => {
      await enter(page, route, slug);
      for (const sel of await anchors(page, slug)) await goTo(page, sel);
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(2500); // entrance animations: axe reads colours mid-fade otherwise
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });

    test("every control on screen is at least 44 × 44 px", async ({ page }) => {
      await enter(page, route, slug);
      const seen = new Map<string, string>();
      for (const sel of await anchors(page, slug)) {
        await goTo(page, sel);
        await page.waitForTimeout(2000); // a card mid-tilt measures smaller than it is
        const small = await page.evaluate((s) => {
          const out: string[] = [];
          document.querySelectorAll<HTMLElement>(`[data-template="${s}"] :is(a[href], button, input:not([type=hidden]), select, textarea, [tabindex='0'])`).forEach((el) => {
            if (el.closest("[aria-hidden=true], [inert]")) return;
            if (!el.checkVisibility({ visibilityProperty: true })) return;
            const target = el.matches("input[type=radio], input[type=checkbox]") ? (el.closest("label") ?? el) : el;
            const r = target.getBoundingClientRect();
            if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight) return;
            if (r.width < 43.5 || r.height < 43.5) out.push(`${el.tagName.toLowerCase()}${el.getAttribute("aria-label") ? `[${el.getAttribute("aria-label")}]` : ""} ${Math.round(r.width)}×${Math.round(r.height)}`);
          });
          return out;
        }, slug);
        for (const s of small) seen.set(s, sel);
      }
      expect([...seen.entries()].map(([s, sel]) => `${sel}: ${s}`)).toEqual([]);
    });

    test("keyboard: every tab stop shows a focus indicator and focus is never trapped", async ({ page }) => {
      await enter(page, route, slug);
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      const stops: string[] = [];
      const bad: string[] = [];
      for (let i = 0; i < 120; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate((s) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const cs = getComputedStyle(el);
          const label = `${el.tagName.toLowerCase()}${el.getAttribute("aria-label") ? `[${el.getAttribute("aria-label")}]` : ""}${el.id ? `#${el.id}` : ""}`;
          return { label, ok: (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== "none", inside: !!el.closest(`[data-template="${s}"]`) };
        }, slug);
        if (!info || !info.inside) break;
        stops.push(info.label);
        if (!info.ok) bad.push(info.label);
      }
      expect(stops.length, "tab stops inside the template").toBeGreaterThanOrEqual(1);
      expect(bad, "focused controls with no visible focus indicator").toEqual([]);
    });

    test.describe("reduced motion", () => {
      test.use({ reducedMotion: "reduce" });
      test("no WebGL context, no smooth scroller, nothing animating once settled", async ({ page }) => {
        await page.addInitScript(() => {
          (window as unknown as { __gl: string[] }).__gl = [];
          const orig = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...a: unknown[]) {
            if (/webgl/.test(type)) (window as unknown as { __gl: string[] }).__gl.push(type);
            return (orig as (...x: unknown[]) => unknown).call(this, type, ...a);
          } as typeof orig;
        });
        await enter(page, route, slug);
        for (const sel of await anchors(page, slug)) await goTo(page, sel);
        expect(await page.evaluate(() => (window as unknown as { __gl: string[] }).__gl), "WebGL contexts requested").toEqual([]);
        expect(await page.evaluate(() => document.documentElement.classList.contains("lenis"))).toBe(false);
        await page.waitForTimeout(800);
        const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").map((a) => `${a.constructor.name}:${(a.effect as KeyframeEffect | null)?.target?.tagName ?? "?"}`));
        expect(running, "running animations").toEqual([]);
      });
    });
  });
}
