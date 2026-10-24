import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MANIFESTS } from "@/lib/kit/generated/manifests";
import sitemap from "@/app/sitemap";
import { BY_SLUG, TEMPLATES } from "@/components/landing/data";
import { TEMPLATE_SLUGS, hasLiveTemplate } from "@/components/templates/registry";
import { TRACKS } from "@/lib/kit/music";

describe("registry", () => {
  it("knows the coded templates and nothing else; unknown, empty and prototype-chain slugs fall back to the generic card", () => {
    expect([...TEMPLATE_SLUGS]).toEqual(["gilded-seal", "we-do"]);
    expect(hasLiveTemplate("gilded-seal")).toBe(true);
    for (const s of ["linen-vow", "", null, undefined, "constructor", "__proto__", "toString"]) expect(hasLiveTemplate(s)).toBe(false);
  });
});

describe("landing catalog", () => {
  it("lists Gilded Seal under Wedding / Elegant / Ivory and marks it live", () => {
    const t = BY_SLUG["gilded-seal"];
    expect(t).toBeTruthy();
    expect(t).toMatchObject({ name: "Gilded Seal", cat: "Wedding", style: "Elegant", color: "Ivory", live: true });
    expect(TEMPLATES.filter((x) => x.live).map((x) => x.slug)).toEqual(["gilded-seal", "we-do"]); // the others keep the phone mock
  });
  it("takes its copy, category, palette label and thumbnails from the catalog manifest; `live` is derived, never hand-set", () => {
    const t = BY_SLUG["gilded-seal"];
    expect(t.desc).toBe(MANIFESTS["gilded-seal"].marketing.desc);
    expect(t.thumb).toBe("/templates/gilded-seal/thumb.webp");
    expect(t.thumbMobile).toBe("/templates/gilded-seal/thumb-mobile.webp");
    // a design without a manifest keeps the phone mock: no thumbnail, no live demo
    const other = BY_SLUG["serenity"];
    expect(other.thumb).toBeUndefined();
    expect(other.live).toBeUndefined();
    expect(fs.readFileSync(path.resolve(__dirname, "../components/landing/data.ts"), "utf8")).not.toMatch(/"live":\s*true/);
  });
  it("every thumbnail the catalog names exists in public/", () => {
    for (const m of Object.values(MANIFESTS)) for (const f of [m.thumbnail, m.thumbnailMobile].filter(Boolean) as string[]) expect(fs.existsSync(path.resolve(__dirname, "../public/templates", m.slug, f)), `${m.slug}/${f}`).toBe(true);
  });
  it("every live catalog entry has a renderer, so its demo link cannot 404", () => {
    for (const t of TEMPLATES.filter((x) => x.live)) expect(hasLiveTemplate(t.slug)).toBe(true);
  });
  it("the sitemap lists its detail page", () => {
    expect(sitemap().some((e) => e.url.endsWith("/templates/gilded-seal"))).toBe(true);
  });
});

describe("music catalog", () => {
  it("has unique keys (the editor stores the key)", () => {
    expect(new Set(TRACKS.map((t) => t.key)).size).toBe(TRACKS.length);
  });
});
