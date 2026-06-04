// HorizonRow tests — render-only smoke. Interactions (click → expand,
// click checkbox → toggle) need a real browser; we limit ourselves to
// what jsdom can verify reliably.

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { HorizonRow } from "./HorizonRow";
import { useStrategyStore, type RowState } from "../store/strategy";
import type { Horizon } from "../lib/period-key";

// Inject row state for tests that exercise content/carry-over branches.
// The production store is a singleton — set state directly rather than mock fs.
function setRowState(horizon: Horizon, patch: Partial<RowState>) {
  useStrategyStore.setState((s) => ({
    rows: { ...s.rows, [horizon]: { ...s.rows[horizon], ...patch } },
  }));
}

afterEach(() => {
  for (const h of ["life-values", "life-goals", "year", "month", "week"] as const) {
    setRowState(h, {
      expanded: false,
      content: "",
      carryOver: null,
      saveStatus: "idle",
      dirty: false,
      loaded: false,
      loadError: false,
    });
  }
});

describe("HorizonRow", () => {
  it("Day row shows 'Today' and a → arrow (no redundant label)", () => {
    render(<HorizonRow horizon="day" />);
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("→")).toBeInTheDocument();
    // The "Open today's page" label was dropped — the title carries it now.
    expect(screen.queryByText("Open today's page")).toBeNull();
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
    expect(screen.getByText("This year")).toBeInTheDocument();
    // Don't lock to a specific year — test runs forever.
    const meta = screen.getAllByText(/^\d{4}$/);
    expect(meta.length).toBeGreaterThan(0);
  });

  it("month row shows 'Month YYYY' as metadata", () => {
    render(<HorizonRow horizon="month" />);
    expect(screen.getByText("This month")).toBeInTheDocument();
    // Match e.g. "April 2026"
    expect(screen.getByText(/^[A-Z][a-z]+ \d{4}$/)).toBeInTheDocument();
  });

  it("week row shows 'Week N, YYYY' as metadata", () => {
    render(<HorizonRow horizon="week" />);
    expect(screen.getByText("This week")).toBeInTheDocument();
    expect(screen.getByText(/^Week \d{1,2}, \d{4}$/)).toBeInTheDocument();
  });

  it("week row with carry-over swaps the header label to 'Carried · Week N' (no year)", () => {
    setRowState("week", {
      loaded: true,
      content: "carried body",
      carryOver: { content: "carried body", sourcePeriod: "2026-W18" },
    });
    render(<HorizonRow horizon="week" />);
    expect(screen.getByText("Carried")).toBeInTheDocument();
    // Short label drops the year.
    expect(screen.getByText(/^Week \d{1,2}$/)).toBeInTheDocument();
    // The full "Week N, YYYY" form does NOT appear when carried.
    expect(screen.queryByText(/^Week \d{1,2}, \d{4}$/)).toBeNull();
  });

  it("expanded row with loadError shows the error notice instead of the invitation", () => {
    setRowState("life-values", { expanded: true, loaded: false, loadError: true, content: "" });
    render(<HorizonRow horizon="life-values" />);
    // The overwrite-warning alert is shown...
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t be opened/i);
    // ...and the empty-horizon "Begin" affordance is NOT (that's the hazard).
    expect(screen.queryByText("Begin")).toBeNull();
  });

  it("expanded week row with carry-over renders the banner AND the preview body", () => {
    setRowState("week", {
      expanded: true,
      loaded: true,
      content: "Carried preview lead.\n\n- one\n- two",
      carryOver: { content: "Carried preview lead.\n\n- one\n- two", sourcePeriod: "2026-W18" },
    });
    render(<HorizonRow horizon="week" />);
    // Banner is present (marginalia register)...
    expect(screen.getByText(/Carried from/)).toBeInTheDocument();
    // ...and the preview body renders alongside it.
    expect(screen.getByText("Carried preview lead.")).toBeInTheDocument();
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
    // Open action remains available so the user can drill into the editor.
    expect(screen.getByText("Open")).toBeInTheDocument();
  });
});
