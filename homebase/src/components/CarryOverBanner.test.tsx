import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { CarryOverBanner } from "./CarryOverBanner";

describe("CarryOverBanner", () => {
  it("renders the formatted source period and the clear link", () => {
    render(<CarryOverBanner horizon="month" sourcePeriod="2026-03" onClear={() => {}} />);
    expect(screen.getByText(/Carried from/)).toBeInTheDocument();
    expect(screen.getByText("March 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "clear" })).toBeInTheDocument();
  });

  it("formats year horizon as the bare year", () => {
    render(<CarryOverBanner horizon="year" sourcePeriod="2025" onClear={() => {}} />);
    expect(screen.getByText("2025")).toBeInTheDocument();
  });

  it("formats week horizon as 'Week N, YYYY'", () => {
    render(<CarryOverBanner horizon="week" sourcePeriod="2026-W17" onClear={() => {}} />);
    expect(screen.getByText("Week 17, 2026")).toBeInTheDocument();
  });

  it("calls onClear when the clear link is clicked", () => {
    const onClear = vi.fn();
    render(<CarryOverBanner horizon="month" sourcePeriod="2026-03" onClear={onClear} />);
    screen.getByRole("button", { name: "clear" }).click();
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("renders the asterism glyph (※) as the marginalia mark", () => {
    const { container } = render(
      <CarryOverBanner horizon="month" sourcePeriod="2026-03" onClear={() => {}} />,
    );
    expect(container.textContent).toContain("※");
  });

  it("carries a title gloss explaining what 'carried' means", () => {
    const { container } = render(
      <CarryOverBanner horizon="month" sourcePeriod="2026-03" onClear={() => {}} />,
    );
    const banner = container.querySelector(".carry-over-banner");
    expect(banner?.getAttribute("title")).toMatch(/carry.?over/i);
  });
});
