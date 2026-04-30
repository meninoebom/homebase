import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { SaveIndicator } from "./SaveIndicator";

describe("SaveIndicator", () => {
  it("renders nothing for status='idle'", () => {
    const { container } = render(<SaveIndicator status="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a pulsing dot for status='saving'", () => {
    const { container } = render(<SaveIndicator status="saving" />);
    const dot = container.firstChild as HTMLElement;
    expect(dot).not.toBeNull();
    expect(dot.classList.contains("save-indicator-pulse")).toBe(true);
    expect(screen.getByLabelText("Saving")).toBe(dot);
  });

  it("renders a non-animated terracotta dot for status='saved'", () => {
    const { container } = render(<SaveIndicator status="saved" />);
    const dot = container.firstChild as HTMLElement;
    expect(dot.classList.contains("save-indicator-pulse")).toBe(false);
    expect(screen.getByLabelText("Saved")).toBe(dot);
  });

  it("renders a darker dot with explanatory tooltip for status='error'", () => {
    const { container } = render(<SaveIndicator status="error" />);
    const dot = container.firstChild as HTMLElement;
    expect(dot.classList.contains("save-indicator-pulse")).toBe(false);
    expect(dot.getAttribute("title")).toMatch(/save failed/i);
    expect(dot.getAttribute("aria-label")).toMatch(/save failed/i);
  });
});
