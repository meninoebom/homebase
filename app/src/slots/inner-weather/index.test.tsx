// Inner weather slot tests — CM6 version.
//
// The template.md file is loaded via Vite's ?raw import and becomes the
// initial document content (plain markdown). CM6 renders the ### headers
// with syntax highlighting; we verify the heading TEXT is in the DOM.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { InnerWeatherSlot } from "./index";

describe("InnerWeatherSlot", () => {
  it("renders all five template section headings on first load", () => {
    render(<InnerWeatherSlot mode="morning" initialDraft="" onDraft={() => {}} />);
    // CM6 renders the heading text (after "### ") as visible content.
    // The "### " prefix is also visible but dimmed via syntax highlighting.
    expect(screen.getByText(/What's weighing on you/)).toBeInTheDocument();
    expect(screen.getByText(/What are you avoiding/)).toBeInTheDocument();
    expect(screen.getByText(/What needs to be said/)).toBeInTheDocument();
    expect(screen.getByText(/What's giving you life/)).toBeInTheDocument();
    expect(screen.getByText(/What you have gratitude for/)).toBeInTheDocument();
  });

  it("rehydrates from a saved draft", () => {
    const draft = [
      "### What's weighing on you",
      "",
      "The Neon.ai demo on Monday.",
      "",
      "### What are you avoiding",
      "",
      "The email from legal.",
    ].join("\n");

    render(<InnerWeatherSlot mode="morning" initialDraft={draft} onDraft={() => {}} />);
    expect(screen.getByText("The Neon.ai demo on Monday.")).toBeInTheDocument();
    expect(screen.getByText("The email from legal.")).toBeInTheDocument();
  });
});
