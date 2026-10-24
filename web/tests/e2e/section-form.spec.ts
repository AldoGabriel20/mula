import { expect, test } from "@playwright/test";
import { fullStack, loginViaUi, seedUser, selectTemplate } from "./helpers";

// TK-044/045: the dashboard's section editor is generated from the content schemas of the picked template's manifest
// (no per-template component). A template without a manifest keeps the editor exactly as it was.
test.skip(!fullStack, "requires api + postgres (set E2E_FULL_STACK=1)");
test.describe.configure({ timeout: 90_000 });

const content = async (page: import("@playwright/test").Page, eventId: string, type: string) => {
  const inv = await (await page.request.get(`/api/v1/events/${eventId}/invitation`)).json();
  return inv.sections.find((s: { type: string }) => s.type === type)?.content ?? {};
};

test("with Gilded Seal picked, each section shows its schema fields and Save stores the same content shape", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await selectTemplate(page, u.event_id!, "gilded-seal");
  await page.goto("/app/invitations/edit");

  // opening: three text fields from the schema, with its limits
  await page.getByRole("button", { name: /Main/ }).click();
  const line = page.getByLabel("Opening line");
  await expect(line).toHaveAttribute("maxlength", "120");
  await line.fill("Together with joy");
  await page.getByLabel(/Opening message/).fill("Two hearts, one story");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect.poll(() => content(page, u.event_id!, "opening")).toMatchObject({ title: "Together with joy", statement: "Two hearts, one story" });

  // story: base heading/body + the schema's chapters; two photo slots
  await page.getByRole("button", { name: /Story/ }).click();
  await page.getByRole("button", { name: "Add a chapter" }).click();
  await page.locator('[data-ch="title"]').first().fill("The first hello");
  await page.locator('[data-ch="text"]').first().fill("A shared umbrella");
  await expect(page.getByText("Main photo")).toBeVisible();
  await expect(page.getByText("Second photo")).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect.poll(() => content(page, u.event_id!, "story")).toMatchObject({ chapters: [{ title: "The first hello", text: "A shared umbrella" }] });

  // music: the catalog's tracks; picking one shows the section, "No music" hides it again
  await page.getByRole("button", { name: /Music/ }).click();
  const track = page.locator("[data-sf-track]");
  await expect(track.locator("option")).toHaveText(["No music", "Gymnopédie No. 1 · Erik Satie"]);
  await track.selectOption("satie-gymnopedie-1");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect.poll(() => content(page, u.event_id!, "music")).toMatchObject({ track: "satie-gymnopedie-1" });
  const inv = await (await page.request.get(`/api/v1/events/${u.event_id}/invitation`)).json();
  expect(inv.sections.find((s: { type: string }) => s.type === "music").visible).toBe(true);

  // the server enforces the same schema: a hero line over its limit is refused with a field path
  const csrf = (await page.context().cookies()).find((c) => c.name === "csrf_token")?.value ?? "";
  const hero = inv.sections.find((s: { type: string }) => s.type === "hero");
  const bad = await page.request.patch(`/api/v1/events/${u.event_id}/invitation/sections/${hero.id}`, { data: { content: { line: "x".repeat(161) } }, headers: { "X-CSRF-Token": csrf } });
  expect(bad.status()).toBe(400);
  expect((await bad.json()).error.fields["content.line"]).toBeTruthy();
});

test("without a template the editor has no schema form", async ({ page }) => {
  const u = seedUser({ withEvent: true });
  await loginViaUi(page, u);
  await page.goto("/app/invitations/edit");
  await page.getByRole("button", { name: /Main/ }).click();
  await expect(page.getByText("Opening message")).toBeVisible(); // the prototype's own textarea
  await expect(page.locator("[data-sf]")).toHaveCount(0);
});
