import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/ErrorState";

describe("Button", () => {
  it("is disabled and aria-busy while loading, and does not fire onClick", () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    const b = screen.getByRole("button", { name: "Save" });
    expect(b).toBeDisabled();
    expect(b).toHaveAttribute("aria-busy", "true");
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Chip", () => {
  it("is a toggle button with aria-pressed when interactive", () => {
    const onClick = vi.fn();
    render(<Chip active onClick={onClick}>Wedding</Chip>);
    const b = screen.getByRole("button", { name: "Wedding" });
    expect(b).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("is static text (no button) without onClick", () => {
    render(<Chip>Static</Chip>);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Static")).toBeInTheDocument();
  });
});

describe("Input", () => {
  it("links label, error text and aria-invalid for assistive tech", () => {
    render(<Input label="Email" error="Enter a valid email" />);
    const field = screen.getByLabelText("Email");
    expect(field).toHaveAttribute("aria-invalid", "true");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Enter a valid email");
    expect(field.getAttribute("aria-describedby")).toBe(alert.id);
  });
  it("has no aria-invalid when valid", () => {
    render(<Input label="Name" />);
    expect(screen.getByLabelText("Name")).not.toHaveAttribute("aria-invalid");
  });
});

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(<Modal open={false} onClose={() => {}} title="T">x</Modal>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("is a labelled modal dialog that closes on ESC and on backdrop click, not on panel click", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Edit guest"><button>inside</button></Modal>);
    const dialog = screen.getByRole("dialog", { name: "Edit guest" });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    fireEvent.click(screen.getByText("inside")); // click within the panel
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(dialog.parentElement!); // the scrim
    expect(onClose).toHaveBeenCalledTimes(2);
  });
  it("locks body scroll while open and restores it on close", () => {
    document.body.style.overflow = "auto";
    const { unmount } = render(<Modal open onClose={() => {}} title="T">x</Modal>);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
});

describe("ErrorState", () => {
  it("announces the error and offers a retry only when a handler is given", () => {
    const retry = vi.fn();
    const { rerender } = render(<ErrorState message="Boom" onRetry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Boom");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
    rerender(<ErrorState message="Boom" />);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });
});
