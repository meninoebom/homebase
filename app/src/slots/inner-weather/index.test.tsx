// Inner weather slot component tests. Like Dreams, the editor is a
// TipTap / ProseMirror instance so full typing behavior is fiddly to
// simulate in jsdom. What we CAN reliably verify:
//
//   1. The template loads and all five section headings render
//   2. A saved draft rehydrates into the editor (round-trip)
//   3. The ARIA label is set
//
// Typing behavior and docToMarkdown round-tripping beyond initial load
// are covered by manual smoke tests in the Tauri dev window.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { InnerWeatherSlot } from "./index";

describe("InnerWeatherSlot", () => {
  it("renders all five template section headings on first load", () => {
    render(<InnerWeatherSlot mode="morning" initialDraft="" onDraft={() => {}} />);
    expect(screen.getByText("What's weighing on you")).toBeInTheDocument();
    expect(screen.getByText("What are you avoiding")).toBeInTheDocument();
    expect(screen.getByText("What needs to be said")).toBeInTheDocument();
    expect(screen.getByText("What's giving you life")).toBeInTheDocument();
    expect(screen.getByText("What you have gratitude for")).toBeInTheDocument();
  });

  it("rehydrates from a saved draft with custom section content", () => {
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
    expect(screen.getByText("What's weighing on you")).toBeInTheDocument();
    expect(screen.getByText("The Neon.ai demo on Monday.")).toBeInTheDocument();
    expect(screen.getByText("What are you avoiding")).toBeInTheDocument();
    expect(screen.getByText("The email from legal.")).toBeInTheDocument();
  });

  it("exposes the editor via an ARIA label for assistive tech", () => {
    render(<InnerWeatherSlot mode="morning" initialDraft="" onDraft={() => {}} />);
    const editor = screen.getByLabelText("Inner weather");
    expect(editor).not.toBeNull();
  });
});
