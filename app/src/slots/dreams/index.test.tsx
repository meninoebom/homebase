// Dreams slot component tests — CM6 version.
//
// CM6 manages its own DOM (not React virtual DOM), so Testing Library's
// screen queries work for verifying rendered text but user-event typing
// doesn't drive CM6's input pipeline. What we can verify:
//
//   1. The editor mounts and renders the placeholder when empty
//   2. The editor renders initial content when given a draft
//   3. The component doesn't throw
//
// Typing and onDraft behavior is verified via manual smoke tests in the
// Tauri dev window. For real coverage of editor interactions, use
// Playwright against a real Chromium — that's the right tool for
// contentEditable, not jsdom.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { DreamsSlot } from "./index";

describe("DreamsSlot", () => {
  it("renders the placeholder when the editor is empty", () => {
    const { container } = render(<DreamsSlot mode="morning" initialDraft="" onDraft={() => {}} />);
    // CM6 renders placeholder text as a .cm-placeholder element.
    const placeholder = container.querySelector(".cm-placeholder");
    expect(placeholder).not.toBeNull();
    expect(placeholder?.textContent).toBe("What did you dream?");
  });

  it("renders initial draft content", () => {
    render(<DreamsSlot mode="morning" initialDraft="A dream about the sea." onDraft={() => {}} />);
    expect(screen.getByText("A dream about the sea.")).toBeInTheDocument();
  });

  it("renders multi-line content as separate lines", () => {
    render(
      <DreamsSlot mode="morning" initialDraft={"First line.\n\nSecond line."} onDraft={() => {}} />,
    );
    expect(screen.getByText("First line.")).toBeInTheDocument();
    expect(screen.getByText("Second line.")).toBeInTheDocument();
  });
});
