import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SectionForm, collectSection, hasSchema, hasText, type SectionFormApi } from "@/components/admin/views/SectionForm";
import { SECTION_SCHEMAS } from "@/lib/kit/generated/sections";
import { MANIFESTS } from "@/lib/kit/generated/manifests";

afterEach(cleanup);

const api = (content: Record<string, Record<string, any>> = {}): SectionFormApi => ({
  content: (t) => content[t] ?? {},
  mediaUrl: (id) => (id ? `/m/${id}` : undefined),
  maxGallery: 12,
  setPhoto: vi.fn().mockResolvedValue(undefined),
  setPhotoAt: vi.fn().mockResolvedValue(undefined),
  addGallery: vi.fn().mockResolvedValue(undefined),
  removeGallery: vi.fn().mockResolvedValue(undefined),
});

const set = (el: HTMLElement, v: string) => fireEvent.change(el, { target: { value: v } });

describe("section schemas drive the form", () => {
  it("the generated schema covers every section type of the manifest", () => {
    for (const s of MANIFESTS["gilded-seal"].sections) expect(hasSchema(s.type), s.type).toBe(true);
    expect(hasSchema("nope")).toBe(false);
  });
  it("hasText: the editor's own Heading/body inputs cover sections with a title or body; music has neither", () => {
    expect(hasText("story")).toBe(true);
    expect(hasText("closing")).toBe(true);
    expect(hasText("music")).toBe(false);
  });
});

describe("opening: the three text fields", () => {
  it("renders from the schema with its labels, limits and placeholders, and reads back trimmed values", () => {
    const { container } = render(<SectionForm type="opening" api={api({ opening: { title: "Together", future_key: 1 } })} />);
    const title = screen.getByLabelText("Opening line") as HTMLInputElement;
    expect(title.value).toBe("Together");
    expect(title.maxLength).toBe(120);
    expect(title.placeholder).toBe("Together with our families");
    expect((screen.getByLabelText(/Opening message/) as HTMLTextAreaElement).maxLength).toBe(90);
    expect(screen.getByText(/About 12 words reads best/)).toBeTruthy();

    set(title, "  Together with joy ");
    set(screen.getByLabelText(/Opening message/), "Two hearts");
    const got = collectSection(container, "opening", { title: "Together", future_key: 1 });
    // only the controlled keys come back (the caller merges them, so future_key survives); an empty untouched key that does not exist is not invented
    expect(got).toEqual({ content: { title: "Together with joy", statement: "Two hearts" }, visible: undefined });
  });

  it("saving an untouched form changes nothing; clearing a field that had text stores an empty string", () => {
    const { container } = render(<SectionForm type="opening" api={api({ opening: { title: "Hi" } })} />);
    expect(collectSection(container, "opening", { title: "Hi" })?.content).toEqual({ title: "Hi" });
    set(screen.getByLabelText("Opening line"), "");
    expect(collectSection(container, "opening", { title: "Hi" })?.content).toEqual({ title: "" });
  });
});

describe("story: photos and chapters", () => {
  it("shows two photo slots (the story photos) and the chapters editor, but not the heading/body the base editor owns", () => {
    const a = api({ story: { photo_ids: ["p1"], chapters: [{ title: "First", text: "Hello" }] } });
    const { container } = render(<SectionForm type="story" api={a} skip={["title", "body"]} />);
    expect(screen.queryByLabelText("Heading")).toBeNull();
    expect(screen.getByText("Replace photo")).toBeTruthy(); // slot 1 has p1
    expect(screen.getByText("Second photo")).toBeTruthy(); // slot 2 is empty
    expect((container.querySelector('[data-ch="title"]') as HTMLInputElement).value).toBe("First");

    fireEvent.click(screen.getByText("Add a chapter"));
    const titles = container.querySelectorAll<HTMLInputElement>('[data-ch="title"]');
    set(titles[1], " Second ");
    const got = collectSection(container, "story", { photo_ids: ["p1"], chapters: [{ title: "First", text: "Hello" }] });
    expect(got?.content.chapters).toEqual([{ title: "First", text: "Hello" }, { title: "Second", text: "" }]);
    expect(got?.content.photo_ids).toBeUndefined(); // photos act at once, they are not part of Save
  });

  it("caps chapters at the schema limit and drops empty rows", () => {
    const { container } = render(<SectionForm type="story" api={api()} skip={["title", "body"]} />);
    const add = screen.getByText("Add a chapter");
    for (let i = 0; i < 7; i++) fireEvent.click(add);
    expect(container.querySelectorAll("[data-ch-row]")).toHaveLength(SECTION_SCHEMAS.story.properties!.chapters.maxItems ?? 0);
    expect((add as HTMLButtonElement).disabled).toBe(true);
    expect(collectSection(container, "story", {})?.content.chapters).toEqual([]);
  });

  it("uploads a photo into slot 1 of 2 and clears one", () => {
    const a = api({ story: { photo_ids: ["p1", "p2"] } });
    render(<SectionForm type="story" api={a} skip={["title", "body"]} />);
    fireEvent.click(screen.getAllByText("Remove")[1]);
    expect(a.setPhotoAt).toHaveBeenCalledWith("story", "photo_ids", 1, 2, null);
  });
});

describe("gallery", () => {
  it("lists photos with descriptions, reads them back onto the existing photos, and respects the template's cap", () => {
    const photos = [{ id: "a", alt: "Old" }, { id: "b", alt: "" }];
    const a = api({ gallery: { photos } });
    const { container } = render(<SectionForm type="gallery" api={a} skip={["title"]} />);
    expect(screen.getByText("Photos · 2 / 12")).toBeTruthy();
    set(screen.getByLabelText("Description of photo 2"), "  The ring ");
    expect(collectSection(container, "gallery", { photos })?.content.photos).toEqual([{ id: "a", alt: "Old" }, { id: "b", alt: "The ring" }]);
    fireEvent.click(screen.getAllByText("Remove")[0]);
    expect(a.removeGallery).toHaveBeenCalledWith("a");
  });
  it("is full at the cap, and an empty gallery explains itself", () => {
    const full = Array.from({ length: 12 }, (_, i) => ({ id: "p" + i, alt: "" }));
    render(<SectionForm type="gallery" api={api({ gallery: { photos: full } })} skip={["title"]} />);
    expect((screen.getByLabelText(/Upload photos/) as HTMLInputElement).disabled).toBe(true);
    cleanup();
    render(<SectionForm type="gallery" api={api()} skip={["title"]} />);
    expect(screen.getByText("Bring your story to life.")).toBeTruthy();
  });
});

describe("music: the track select", () => {
  it("lists the catalog, a track makes the section visible and 'No music' hides it", () => {
    const { container } = render(<SectionForm type="music" api={api({ music: { track: "" } })} />);
    const select = container.querySelector("[data-sf-track]") as HTMLSelectElement;
    expect([...select.options].map((o) => o.value)).toEqual(["", "satie-gymnopedie-1"]);
    expect(collectSection(container, "music", { track: "" })).toEqual({ content: { track: "" }, visible: false });
    set(select, "satie-gymnopedie-1");
    expect(collectSection(container, "music", {})).toEqual({ content: { track: "satie-gymnopedie-1" }, visible: true });
  });
});

describe("photos", () => {
  it("hero and closing show one photo tile each; uploading calls the editor with the right field and kind", () => {
    const a = api({ hero: { photo_id: "h" }, closing: {} });
    const hero = render(<SectionForm type="hero" api={a} skip={["title", "line"]} />);
    expect(hero.container.querySelector(".arch")).not.toBeNull();
    fireEvent.click(screen.getByText("Remove"));
    expect(a.setPhoto).toHaveBeenCalledWith("hero", "photo_id", null);
    cleanup();
    const closing = render(<SectionForm type="closing" api={a} skip={["title", "body"]} />);
    expect(closing.container.querySelector(".arch")).toBeNull();
    expect(screen.getByText("Closing photo")).toBeTruthy();
    const input = closing.container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "p.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(a.setPhoto).toHaveBeenCalledWith("closing", "photo_id", file, "photo");
  });

  it("collectSection finds nothing in a panel without a form", () => {
    const div = document.createElement("div");
    expect(collectSection(div, "opening", {})).toBeNull();
  });
});
