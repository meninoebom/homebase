// HorizonRow tests — render-only smoke. Interactions (click → expand,
// click checkbox → toggle) need a real browser; we limit ourselves to
// what jsdom can verify reliably.

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { HorizonRow } from "./HorizonRow";

describe("HorizonRow", () => {
  it("Day row shows 'Open morning ritual' and a → arrow", () => {
    render(<HorizonRow horizon="day" />);
    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByText("Open morning ritual")).toBeInTheDocument();
    expect(screen.getByText("→")).toBeInTheDocument();
  });

  it("Day row click triggers onDayClick", () => {
    const onDayClick = vi.fn();
    render(<HorizonRow horizon="day" onDayClick={onDayClick} />);
    screen.getByRole("button").click();
    expect(onDayClick).toHaveBeenCalledTimes(1);
  });

  it("persistent row (life-values) shows 'Persistent' meta and + glyph", () => {
    render(<HorizonRow horizon="life-values" />);
    expect(screen.getByText("Life values")).toBeInTheDocument();
    expect(screen.getByText("Persistent")).toBeInTheDocument();
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("persistent row (life-goals) shows 'Persistent' meta", () => {
    render(<HorizonRow horizon="life-goals" />);
    expect(screen.getByText("Life goals")).toBeInTheDocument();
    expect(screen.getByText("Persistent")).toBeInTheDocument();
  });

  it("year row shows the current ISO year as metadata", () => {
    render(<HorizonRow horizon="year" />);
    expect(screen.getByText("Year")).toBeInTheDocument();
    // Don't lock to a specific year — test runs forever.
    const meta = screen.getAllByText(/^\d{4}$/);
    expect(meta.length).toBeGreaterThan(0);
  });

  it("month row shows 'Month YYYY' as metadata", () => {
    render(<HorizonRow horizon="month" />);
    expect(screen.getByText("Month")).toBeInTheDocument();
    // Match e.g. "April 2026"
    expect(screen.getByText(/^[A-Z][a-z]+ \d{4}$/)).toBeInTheDocument();
  });

  it("week row shows 'Week N, YYYY' as metadata", () => {
    render(<HorizonRow horizon="week" />);
    expect(screen.getByText("Week")).toBeInTheDocument();
    expect(screen.getByText(/^Week \d{1,2}, \d{4}$/)).toBeInTheDocument();
  });
});
