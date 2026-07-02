// Footer status-text logic for the day page. The route component itself isn't
// rendered (router convention); saveFooterText is the pure, exported seam.
// EmptyState is also exported so we can assert the slot gloss copy.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { EmptyState, firstMeaningfulLine, ResurfacePanel, saveFooterText } from "./day";

describe("saveFooterText", () => {
  it("shows 'saving…' while a save is in flight", () => {
    expect(saveFooterText(true, false, "saved 9:14 am")).toBe("saving…");
  });

  it("shows an error instead of a stale 'saved' label when the save failed", () => {
    expect(saveFooterText(false, true, "saved 9:14 am")).toMatch(/couldn.t save/i);
  });

  it("shows the saved label when idle and healthy", () => {
    expect(saveFooterText(false, false, "saved 9:14 am")).toBe("saved 9:14 am");
  });

  it("'saving…' takes precedence over a prior error during a retry", () => {
    expect(saveFooterText(true, true, "")).toBe("saving…");
  });
});

describe("EmptyState", () => {
  it("carries a one-sentence gloss explaining what a slot is", () => {
    render(<EmptyState onCustomize={() => {}} />);
    // The gloss must explain "slot" in plain words — not just restate the headline.
    expect(screen.getByTestId("slot-gloss")).toBeInTheDocument();
    expect(screen.getByTestId("slot-gloss").textContent).toMatch(/slot/i);
  });

  it("renders the headline and customize button alongside the gloss", () => {
    render(<EmptyState onCustomize={() => {}} />);
    expect(screen.getByText(/no slots yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /customize/i })).toBeInTheDocument();
  });
});

describe("firstMeaningfulLine (week compass)", () => {
  it("returns the first prose line, skipping markdown headings", () => {
    expect(firstMeaningfulLine("# Week 24\n\nShip the resurface feature.")).toBe(
      "Ship the resurface feature.",
    );
  });

  it("returns empty string for an empty or heading-only file", () => {
    expect(firstMeaningfulLine("")).toBe("");
    expect(firstMeaningfulLine("# Week 24\n\n## Notes\n\n")).toBe("");
  });
});

describe("ResurfacePanel", () => {
  it("renders nothing until (and unless) history resolves (silent for new users)", () => {
    // With no folder handle initialized, gatherResurfacing rejects and the
    // panel stays empty. The panel must degrade to nothing, not throw.
    const { container } = render(<ResurfacePanel />);
    expect(container).toBeEmptyDOMElement();
  });
});
