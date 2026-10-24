import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemePanel, checkDraft, type ThemeApi } from "@/components/admin/views/ThemePanel";
import { MANIFESTS } from "@/lib/kit/generated/manifests";
import type { Manifest } from "@/lib/kit/manifest";

afterEach(cleanup);

const gs = MANIFESTS["gilded-seal"];
const mk = (can: Partial<Manifest["customizable"]>, theme = {}): ThemeApi => ({
  manifest: { ...gs, customizable: { palette: [], fontPairings: [], tokens: [], motion: [], ...can } },
  theme,
  save: vi.fn().mockResolvedValue(undefined),
});

describe("<ThemePanel>", () => {
  it("renders nothing for a template with nothing customisable (and a single font pairing is no choice)", () => {
    const { container } = render(<ThemePanel api={mk({ fontPairings: ["classic-serif"] })} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders only the controls the manifest lists", () => {
    const { container } = render(<ThemePanel api={mk({ palette: ["rose-linen", "sage-parchment"], motion: ["full", "calm"] })} />);
    expect(screen.getByRole("button", { name: "Rose & Linen" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sage & Parchment" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Midnight & Gold" })).toBeNull();
    expect(screen.getByRole("button", { name: "Calm" })).toBeTruthy();
    expect(container.querySelector("[data-theme-token]")).toBeNull();
    expect(container.querySelector("[data-theme-pairing]")).toBeNull();
  });

  it("saves the chosen palette, accent and motion in one theme, and Save stays off until something changed", async () => {
    const api = mk({ palette: ["rose-linen"], tokens: ["accent"], motion: ["full", "calm"] });
    const { container } = render(<ThemePanel api={api} />);
    const save = container.querySelector("[data-theme-save]") as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Rose & Linen" }));
    fireEvent.change(container.querySelector("[data-theme-token=accent]")!, { target: { value: "#c9a27a" } });
    fireEvent.click(screen.getByRole("button", { name: "Calm" }));
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    await waitFor(() => expect(api.save).toHaveBeenCalledWith({ palette: "rose-linen", motion: "calm", tokens: { accent: "#C9A27A" } }));
  });

  it("warns as the host picks a colour whose text would be unreadable, and does not allow saving it", () => {
    const api = mk({ tokens: ["accent"] });
    const { container } = render(<ThemePanel api={api} />);
    fireEvent.change(container.querySelector("[data-theme-token=accent]")!, { target: { value: "#1a1a1a" } });
    expect(container.querySelector("[data-theme-warning]")?.textContent).toMatch(/too faint.*onAccent on accent.*needs 4\.5:1/);
    expect((container.querySelector("[data-theme-save]") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(container.querySelector("[data-theme-token=accent]")!, { target: { value: "#c9a27a" } });
    expect(container.querySelector("[data-theme-warning]")).toBeNull();
    expect((container.querySelector("[data-theme-save]") as HTMLButtonElement).disabled).toBe(false);
  });

  it("starts from the stored theme (a legacy label shows as its palette), and 'back to the design's look' clears it", async () => {
    const api = mk({ palette: ["rose-linen"] }, { palette: "Blush" });
    const { container } = render(<ThemePanel api={api} />);
    expect(screen.getByRole("button", { name: "Rose & Linen" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(container.querySelector("[data-theme-reset]")!);
    await waitFor(() => expect(api.save).toHaveBeenCalledWith({}));
    expect(screen.getByRole("button", { name: "Rose & Linen" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("shows the API's message when saving fails and keeps the draft", async () => {
    const api = mk({ palette: ["rose-linen"] });
    (api.save as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("not available for this design"));
    const { container } = render(<ThemePanel api={api} />);
    fireEvent.click(screen.getByRole("button", { name: "Rose & Linen" }));
    fireEvent.click(container.querySelector("[data-theme-save]")!);
    await waitFor(() => expect(screen.getByText("not available for this design")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Rose & Linen" }).getAttribute("aria-pressed")).toBe("true");
  });
});

describe("checkDraft", () => {
  it("passes the defaults and every listed palette, fails a dark accent", () => {
    expect(checkDraft(gs, {}).ok).toBe(true);
    const open: Manifest = { ...gs, customizable: { ...gs.customizable, tokens: ["accent"] } };
    expect(checkDraft(open, { tokens: { accent: "#101010" } }).ok).toBe(false);
    for (const id of gs.customizable.palette) expect(checkDraft({ ...gs, customizable: { ...gs.customizable, palette: [id] } }, { palette: id }).ok, id).toBe(true);
  });
});
