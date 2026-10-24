import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import { fullStack, genericToken, goTo, gsTest as test, loginViaUi, openInvitation, seedUser, selectTemplate, waitForVeil } from "./helpers";

// Gilded Seal (docs/15, docs/16 GS-060). Runs on the desktop, tablet and mobile projects.
// The demo specs need only the web server; the "live" ones need the API + Postgres (E2E_FULL_STACK=1).

const DEMO = "/demo/gilded-seal?to=Sarah";

// The page is heavy by design (a 3D cover, shaders, long entrance timelines) and the three projects share one machine:
// give each test room instead of retrying flakes.
test.describe.configure({ timeout: 90_000 });
test.use({ actionTimeout: 20_000 });

test.describe("demo", () => {
  test("veil → open → heading focused → RSVP flips the card → a wish joins the deck, nothing is sent", async ({ page }) => {
    const apiCalls: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/v1/")) apiCalls.push(`${r.method()} ${r.url()}`);
    });
    await page.goto(DEMO);
    await expect(page.getByRole("status", { name: "Preparing your invitation" })).toBeVisible();
    await openInvitation(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Adrian & Isabella");

    // RSVP: the guest's name came from ?to=, the card turns over on submit
    await goTo(page, "#rsvp");
    const rsvp = page.locator("#rsvp");
    await expect(rsvp.getByPlaceholder("As written on your invitation")).toHaveValue("Sarah");
    await rsvp.getByLabel(/Joyfully accepts/).check();
    await rsvp.getByRole("button", { name: "Send my reply" }).click();
    await expect(rsvp.getByRole("heading", { name: "Thank you, Sarah" })).toBeVisible();
    await expect(rsvp.getByRole("button", { name: "Change my reply" })).toBeVisible();
    await expect(rsvp.getByText(/preview, so your reply has not been sent/)).toBeVisible();
    await rsvp.getByRole("button", { name: "Change my reply" }).click();
    await expect(rsvp.getByRole("button", { name: "Send my reply" })).toBeVisible();

    // wishes: a new one is shown first and stays on this device
    await goTo(page, "#wishes");
    const wishes = page.locator("#wishes");
    await wishes.getByLabel("Your name").fill("Daniel");
    await wishes.getByLabel(/Your wish/).fill("May every day feel like today.");
    await wishes.getByRole("button", { name: "Send wish" }).click();
    await expect(wishes.getByText(/shown on this device only/)).toBeVisible();
    await expect(wishes.getByText("May every day feel like today.").first()).toBeVisible();
    expect(apiCalls, "the demo must never call the API").toEqual([]);
  });

  test("Escape skips the intro", async ({ page }) => {
    await page.goto(DEMO);
    await waitForVeil(page);
    await page.getByRole("button", { name: "Open Invitation" }).click();
    // with a GPU the 3D opening runs ~4 s and shows "Skip intro"; the static cover finishes in well under a second.
    // Escape must end it either way, at once.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Wedding invitation cover" })).toBeHidden({ timeout: 5_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    // scroll is unlocked
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe("hidden");
  });

  test("the whole page is reachable: sections in order, carousels work, no horizontal scroll", async ({ page }) => {
    await page.goto(DEMO);
    await openInvitation(page);
    const order = await page.evaluate(() => ["hero", "statement", "story", "date", "details", "venue", "gallery", "gift", "rsvp", "wishes"].map((id) => (id === "hero" ? document.querySelector("[data-vis=hero]") : document.getElementById(id))?.getBoundingClientRect().top ?? NaN));
    // document order = visual order (the hero's own top is 0 at load; every later section starts below the one before)
    const tops = await page.evaluate(() => ["statement", "story", "date", "details", "venue", "gallery", "gift", "rsvp", "wishes"].map((id) => document.getElementById(id)!.getBoundingClientRect().top + scrollY));
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    expect(order[0]).toBeLessThanOrEqual(1);

    await goTo(page, "#details");
    const next = page.getByRole("button", { name: "Next event" });
    await next.click();
    await expect(page.getByRole("button", { name: "Wedding Reception 6.00 PM" })).toHaveAttribute("aria-pressed", "true");
    await page.locator("#details").getByRole("link", { name: "See the venue" }).last().click();
    await expect(page.locator("#venue").getByRole("heading", { level: 3, name: "Reception Venue" })).toBeVisible();

    for (const sel of ["#statement", "#story", "#date", "#details", "#venue", "#gallery", "#gift", "#rsvp", "#wishes"]) {
      await goTo(page, sel);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(over, `horizontal overflow at ${sel}`).toBeLessThanOrEqual(1);
    }
  });

  test("axe finds no serious or critical violations once the invitation is open", async ({ page }) => {
    await page.goto(DEMO);
    await openInvitation(page);
    for (const sel of ["#statement", "#date", "#details", "#venue", "#gift", "#rsvp", "#wishes"]) await goTo(page, sel);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(2500); // let the entrance animations finish: axe reads colours mid-fade otherwise
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no WebGL at all, no smooth scroller, a flat gallery, and the RSVP card still turns", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __gl: string[] }).__gl = [];
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...a: unknown[]) {
        if (/webgl/.test(type)) (window as unknown as { __gl: string[] }).__gl.push(type);
        return (orig as (...x: unknown[]) => unknown).call(this, type, ...a);
      } as typeof orig;
    });
    await page.goto(DEMO);
    await openInvitation(page);
    await goTo(page, "#gallery");
    expect(await page.evaluate(() => (window as unknown as { __gl: string[] }).__gl), "WebGL contexts requested").toEqual([]);
    expect(await page.evaluate(() => document.documentElement.classList.contains("lenis"))).toBe(false);

    // flat grid: figures are in normal flow, untransformed and fully visible
    const g = await page.evaluate(() => {
      const sec = document.getElementById("gallery")!;
      const f = sec.querySelector("figure")!;
      const cs = getComputedStyle(f);
      return { position: cs.position, transform: cs.transform, opacity: cs.opacity, stage: getComputedStyle(sec.firstElementChild!).position };
    });
    // the stage is in normal flow (not the sticky 3D scene)
    expect(g).toMatchObject({ position: "relative", transform: "none", opacity: "1", stage: "relative" });

    await goTo(page, "#rsvp");
    const rsvp = page.locator("#rsvp");
    await rsvp.getByLabel(/Regretfully declines/).check();
    await rsvp.getByRole("button", { name: "Send my reply" }).click();
    await expect(rsvp.getByRole("heading", { name: /Thank you/ })).toBeVisible();
  });
});

test.describe("live invitation", () => {
  test.skip(!fullStack, "requires api + postgres (set E2E_FULL_STACK=1)");

  test("a personal link: RSVP persists across a reload, the wish reaches the host, a generic link only points to it", async ({ page, browser }) => {
    const u = seedUser({ withEvent: true });
    await loginViaUi(page, u);
    await selectTemplate(page, u.event_id!, "gilded-seal");
    const generic = await genericToken(page, u.event_id!);

    const guestCtx = await browser.newContext({ reducedMotion: "reduce" }); // no session, and the fast path
    const g = await guestCtx.newPage();
    const errors: string[] = [];
    g.on("console", (m) => m.type() === "error" && !m.location().url.includes("/music/") && errors.push(m.text()));
    await g.goto(`/invite/${u.guest_token}`);
    await openInvitation(g);
    await expect(g.getByRole("heading", { level: 1 })).toHaveAccessibleName("Aldo & Cilla");

    await goTo(g, "#rsvp");
    const rsvp = g.locator("#rsvp");
    const name = rsvp.getByPlaceholder("As written on your invitation");
    await expect(name).toHaveValue("E2E Guest");
    await expect(name).toHaveJSProperty("readOnly", true);
    await rsvp.getByLabel(/Joyfully accepts/).check();
    await rsvp.getByRole("button", { name: "More guests" }).click(); // the guest may bring one person
    await rsvp.getByPlaceholder(/Dietary needs/).fill("No peanuts");
    await rsvp.getByRole("button", { name: "Send my reply" }).click();
    await expect(rsvp.getByRole("heading", { name: "Thank you, E2E" })).toBeVisible();
    await expect(rsvp.getByText(/all 2 of you/)).toBeVisible();

    await g.reload();
    await openInvitation(g);
    await expect(g.locator("#rsvp").getByRole("heading", { name: "Thank you, E2E" })).toBeVisible(); // the reply is the server's, not local state

    await goTo(g, "#wishes");
    const wishes = g.locator("#wishes");
    await expect(wishes.getByText("No wishes yet")).toBeVisible();
    await wishes.getByLabel(/Your wish/).fill("Wishing you both a wonderful life.");
    await wishes.getByRole("button", { name: "Send wish" }).click();
    await expect(wishes.getByText(/shared with the couple/)).toBeVisible();
    await expect(wishes.getByText("Wishing you both a wonderful life.").first()).toBeVisible();

    // the host sees both (session context)
    const guests = await (await page.request.get(`/api/v1/events/${u.event_id}/guests`)).json();
    expect(guests.data.find((x: { name: string }) => x.name === "E2E Guest")).toMatchObject({ rsvp_status: "yes" });
    const list = await (await page.request.get(`/api/v1/events/${u.event_id}/wishes`)).json();
    expect(list.data.map((w: { author_name: string; message: string }) => `${w.author_name}: ${w.message}`)).toContain("E2E Guest: Wishing you both a wonderful life.");

    // a generic link renders the same template but cannot reply
    const gc = await browser.newContext({ reducedMotion: "reduce" });
    const gp = await gc.newPage();
    await gp.goto(`/invite/${generic}`);
    await openInvitation(gp);
    await goTo(gp, "#rsvp");
    await expect(gp.locator("#rsvp").getByText(/open the personal link/)).toBeVisible();
    await expect(gp.locator("#rsvp form")).toHaveCount(0);
    // ...but its guestbook shows the wish that was just left
    await goTo(gp, "#wishes");
    await expect(gp.locator("#wishes").getByText("Wishing you both a wonderful life.").first()).toBeVisible();
    await gc.close();
    await guestCtx.close();
    expect(errors, "guest console errors").toEqual([]);
  });

  test("an invitation without a template keeps the generic card", async ({ browser }) => {
    const u = seedUser({ withEvent: true });
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto(`/invite/${u.guest_token}`);
    await expect(p.getByText("Dear E2E Guest,")).toBeVisible();
    await expect(p.locator("[data-template]")).toHaveCount(0);
    await ctx.close();
  });

  test("the host's draft preview shows the template, flagged, and sends nothing", async ({ page }) => {
    const u = seedUser({ withEvent: true });
    await page.goto(`/preview/${u.event_id}`);
    await expect(page).toHaveURL(/\/login\?next=/); // signed out → login
    await loginViaUi(page, u);
    await selectTemplate(page, u.event_id!, "gilded-seal");
    await page.goto(`/preview/${u.event_id}`);
    await expect(page.getByText(/Draft preview/)).toBeVisible();
    await openInvitation(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Aldo & Cilla");
    const sent: string[] = [];
    page.on("request", (r) => r.method() === "POST" && sent.push(r.url()));
    await goTo(page, "#rsvp");
    await page.locator("#rsvp").getByPlaceholder("As written on your invitation").fill("Host");
    await page.locator("#rsvp").getByLabel(/Joyfully accepts/).check();
    await page.locator("#rsvp").getByRole("button", { name: "Send my reply" }).click();
    await expect(page.locator("#rsvp").getByText(/preview, so your reply has not been sent/)).toBeVisible();
    expect(sent).toEqual([]);
  });
});
