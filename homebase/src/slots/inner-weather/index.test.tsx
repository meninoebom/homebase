// Inner weather tests — hub version (single field with hint suggestions).

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { InnerWeatherSlot } from "./index";

describe("InnerWeatherSlot", () => {
  it("renders the suggestion hints", () => {
    render(<InnerWeatherSlot mode="morning" initialDraft="" onDraft={() => {}} />);
    expect(screen.getByText(/weighing on you/)).toBeInTheDocument();
    expect(screen.getByText(/gratitude/)).toBeInTheDocument();
  });

  it("renders the placeholder when empty", () => {
    const { container } = render(
      <InnerWeatherSlot mode="morning" initialDraft="" onDraft={() => {}} />,
    );
    const placeholder = container.querySelector(".cm-placeholder");
    expect(placeholder?.textContent).toBe("What's alive in you this morning?");
  });

  it("renders initial draft content", () => {
    render(
      <InnerWeatherSlot mode="morning" initialDraft="The demo is tomorrow." onDraft={() => {}} />,
    );
    expect(screen.getByText("The demo is tomorrow.")).toBeInTheDocument();
  });
});
