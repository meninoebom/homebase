import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { ProgressMark } from "./ProgressMark";

describe("ProgressMark", () => {
  it("renders nothing for non-time-bound horizons", () => {
    const { container: c1 } = render(<ProgressMark horizon="life-values" />);
    expect(c1.firstChild).toBeNull();
    const { container: c2 } = render(<ProgressMark horizon="life-goals" />);
    expect(c2.firstChild).toBeNull();
  });

  it("renders a year bar with current day-of-year and 365 (or 366)", () => {
    // Mid-year: day 200 (~July 19) of a non-leap year.
    const day200 = new Date("2025-07-19T12:00:00Z");
    render(<ProgressMark horizon="year" now={day200} />);
    expect(screen.getByText("of 365")).toBeInTheDocument();
    // The current-day label is computed from local time, so just assert
    // that *some* numeral matches \d{1,3} appears as the current value.
    expect(screen.getByLabelText(/^\d+ of 365 days$/)).toBeInTheDocument();
  });

  it("uses 366 for leap years", () => {
    const day1 = new Date("2024-01-15T12:00:00Z");
    render(<ProgressMark horizon="year" now={day1} />);
    expect(screen.getByText("of 366")).toBeInTheDocument();
  });

  it("renders a month bar with current day-of-month and days-in-month", () => {
    const apr15 = new Date("2026-04-15T12:00:00Z");
    render(<ProgressMark horizon="month" now={apr15} />);
    expect(screen.getByText("of 30")).toBeInTheDocument();

    const feb20Leap = new Date("2024-02-20T12:00:00Z");
    const { rerender } = render(<ProgressMark horizon="month" now={feb20Leap} />);
    rerender(<ProgressMark horizon="month" now={feb20Leap} />);
    expect(screen.getByText("of 29")).toBeInTheDocument();
  });

  it("renders 7 day labels for the week", () => {
    const monday = new Date("2026-04-27T12:00:00Z"); // a Monday
    const { container } = render(<ProgressMark horizon="week" now={monday} />);
    expect(container.textContent).toContain("M");
    expect(container.textContent).toContain("W");
    expect(container.textContent).toContain("F");
    // Should render exactly 7 label cells.
    const cells = container.querySelectorAll("div[style*='border-top']");
    expect(cells).toHaveLength(7);
  });

  it("week mark uses Monday-start weekday indexing", () => {
    // Sunday should be the LAST cell (index 6), not the first.
    const sunday = new Date("2026-05-03T12:00:00Z"); // a Sunday
    const { container } = render(<ProgressMark horizon="week" now={sunday} />);
    const cells = container.querySelectorAll("div[style*='border-top']");
    // The today cell uses the accent border. With Sun=index 6, the LAST
    // cell should reference the accent color in its inline style.
    const lastCell = cells[6] as HTMLElement;
    expect(lastCell.getAttribute("style")).toContain("var(--accent-1)");
  });
});
