import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KitRoot } from "@/lib/kit/KitRoot";
import { useKitCleanup, useManifest, useMotionPolicy, useTheme } from "@/lib/kit/useTheme";

afterEach(cleanup);

function Probe() {
  const theme = useTheme();
  const manifest = useManifest();
  const policy = useMotionPolicy();
  return <p data-testid="probe">{`${manifest.slug}|${theme.colors.bg}|${theme.fonts.display}|${policy.level}`}</p>;
}

describe("<KitRoot>", () => {
  it("applies the theme as CSS variables on its own element, never on :root", () => {
    const before = document.documentElement.getAttribute("style");
    const { container } = render(
      <KitRoot slug="gilded-seal" mode="demo">
        <Probe />
      </KitRoot>,
    );
    const root = container.querySelector("[data-kit-root='gilded-seal']") as HTMLElement;
    expect(root.style.getPropertyValue("--k-bg")).toBe("#F7F2E9");
    expect(root.style.getPropertyValue("--k-font-display")).toContain("Cormorant Garamond");
    expect(root.style.display).toBe("contents");
    expect(document.documentElement.getAttribute("style")).toBe(before);
    expect(document.documentElement.style.getPropertyValue("--k-bg")).toBe("");
    expect(screen.getByTestId("probe").textContent).toMatch(/^gilded-seal\|#F7F2E9\|"Cormorant Garamond", serif\|/);
  });

  it("renders the pairing's fonts only", () => {
    const { container } = render(
      <KitRoot slug="gilded-seal" mode="demo">
        <span />
      </KitRoot>,
    );
    const hrefs = [...container.querySelectorAll("link[rel=preload][as=font]")].map((l) => l.getAttribute("href"));
    expect(hrefs).toEqual(["/fonts/cormorant/CormorantGaramond-normal.woff2", "/fonts/manrope/Manrope-normal.woff2", "/fonts/pinyon/PinyonScript-normal.woff2"]);
    expect(container.querySelector("style[data-kit-fonts]")?.textContent).not.toContain("Bodoni");
  });

  it("runs registered cleanups on unmount, newest first, and an early remover cancels one", () => {
    const order: string[] = [];
    function Reg() {
      const register = useKitCleanup();
      return (
        <button
          onClick={() => {
            register(() => order.push("a"));
            register(() => order.push("b"));
            register(() => order.push("never"))();
          }}
        >
          go
        </button>
      );
    }
    const { unmount } = render(
      <KitRoot slug="gilded-seal" mode="live">
        <Reg />
      </KitRoot>,
    );
    screen.getByText("go").click();
    unmount();
    expect(order).toEqual(["b", "a"]);
  });

  it("refuses a slug the catalog does not know", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <KitRoot slug="nope" mode="live">
          <span />
        </KitRoot>,
      ),
    ).toThrow(/no manifest/);
  });
});
