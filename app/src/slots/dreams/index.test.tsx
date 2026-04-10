// Dreams slot component tests. The editor is a TipTap / ProseMirror
// instance, so full typing behavior is fiddly to simulate in jsdom
// (ProseMirror intercepts input events before they reach the DOM in a way
// that Testing Library's user-event can't easily trigger). What we CAN
// reliably verify without a real browser:
//
//   1. The editor mounts and renders the placeholder when initialDraft is empty
//   2. The editor renders the initial draft content when initialDraft is set
//   3. The component does not throw when given typical inputs
//
// Typing behavior is verified by manual smoke tests in the Tauri dev window.
// If this ever starts failing silently, add a Playwright test against a
// real Chromium — that's the right tool for ProseMirror, not jsdom.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { DreamsSlot } from "./index";

describe("DreamsSlot", () => {
  it("renders the editor with the placeholder attribute when empty", () => {
    render(<DreamsSlot mode="morning" initialDraft="" onDraft={() => {}} />);
    // TipTap's Placeholder extension sets data-placeholder on the first
    // empty node. Our CSS renders it via ::before; we verify the attribute.
    const placeholder = document.querySelector('[data-placeholder="What did you dream?"]');
    expect(placeholder).not.toBeNull();
  });

  it("renders the initial draft content", () => {
    render(<DreamsSlot mode="morning" initialDraft="A dream about the sea." onDraft={() => {}} />);
    expect(screen.getByText("A dream about the sea.")).toBeInTheDocument();
  });

  it("renders multi-paragraph drafts as separate paragraphs", () => {
    // Note: JSX attributes do not interpret escape sequences, so the
    // newlines have to go through a JS expression (`{...}`), not a
    // double-quoted attribute string.
    const draft = "First paragraph.\n\nSecond paragraph.";
    render(<DreamsSlot mode="morning" initialDraft={draft} onDraft={() => {}} />);
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
  });

  it("exposes the editor via an ARIA label for assistive tech", () => {
    render(<DreamsSlot mode="morning" initialDraft="" onDraft={() => {}} />);
    const editor = screen.getByLabelText("Dreams");
    expect(editor).not.toBeNull();
  });
});
