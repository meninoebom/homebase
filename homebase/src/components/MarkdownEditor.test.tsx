// MarkdownEditor tests.
//
// CM6 manages its own DOM (not React virtual DOM), so jsdom-based tests
// can verify mount, placeholder, initial content, and that the checkbox
// decorations render — but not user-event typing or click-to-toggle.
// (Same caveat as DreamsSlot tests.) For real interaction coverage,
// Playwright against Chromium is the right tool.

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { MarkdownEditor } from "./MarkdownEditor";

describe("MarkdownEditor", () => {
  it("mounts and renders the placeholder when value is empty", () => {
    const { container } = render(
      <MarkdownEditor value="" onChange={() => {}} placeholder="What is this for?" />,
    );
    const placeholder = container.querySelector(".cm-placeholder");
    expect(placeholder).not.toBeNull();
    expect(placeholder?.textContent).toBe("What is this for?");
  });

  it("renders initial markdown content", () => {
    render(<MarkdownEditor value="A simple line." onChange={() => {}} />);
    expect(screen.getByText("A simple line.")).toBeInTheDocument();
  });

  it("renders a clickable checkbox widget for `- [ ]` lines", () => {
    const { container } = render(<MarkdownEditor value="- [ ] Apply to PhD" onChange={() => {}} />);
    const checkbox = container.querySelector(".cm-checkbox");
    expect(checkbox).not.toBeNull();
    expect(checkbox?.classList.contains("cm-checkbox-checked")).toBe(false);
    expect(checkbox?.getAttribute("role")).toBe("checkbox");
    expect(checkbox?.getAttribute("aria-checked")).toBe("false");
  });

  it("renders a checked checkbox widget for `- [x]` lines", () => {
    const { container } = render(
      <MarkdownEditor value="- [x] Submit Casr v0" onChange={() => {}} />,
    );
    const checkbox = container.querySelector(".cm-checkbox");
    expect(checkbox).not.toBeNull();
    expect(checkbox?.classList.contains("cm-checkbox-checked")).toBe(true);
    expect(checkbox?.getAttribute("aria-checked")).toBe("true");
  });

  it("renders multiple checkboxes for a list with mixed states", () => {
    const { container } = render(
      <MarkdownEditor
        value={["- [x] Done", "- [ ] Not yet", "- [x] Also done"].join("\n")}
        onChange={() => {}}
      />,
    );
    const boxes = container.querySelectorAll(".cm-checkbox");
    expect(boxes).toHaveLength(3);
    expect(boxes[0].classList.contains("cm-checkbox-checked")).toBe(true);
    expect(boxes[1].classList.contains("cm-checkbox-checked")).toBe(false);
    expect(boxes[2].classList.contains("cm-checkbox-checked")).toBe(true);
  });

  it("renders nested checkboxes (one level of indentation)", () => {
    const value = ["- [ ] Apply to PhD", "  - [x] Draft personal statement"].join("\n");
    const { container } = render(<MarkdownEditor value={value} onChange={() => {}} />);
    const boxes = container.querySelectorAll(".cm-checkbox");
    expect(boxes).toHaveLength(2);
    expect(boxes[0].classList.contains("cm-checkbox-checked")).toBe(false);
    expect(boxes[1].classList.contains("cm-checkbox-checked")).toBe(true);
  });

  it("does not render a checkbox for malformed syntax", () => {
    const { container } = render(
      <MarkdownEditor
        value={["-[ ] no space after dash", "- [] missing inner char"].join("\n")}
        onChange={() => {}}
      />,
    );
    expect(container.querySelectorAll(".cm-checkbox")).toHaveLength(0);
  });

  it("syncs external value updates into the editor (clear-banner flow)", () => {
    const onChange = vi.fn();
    const { rerender, container } = render(
      <MarkdownEditor value="- [x] First" onChange={onChange} />,
    );
    expect(container.querySelectorAll(".cm-checkbox")).toHaveLength(1);

    // External update — e.g., clearCarryOver empties the buffer.
    rerender(<MarkdownEditor value="" onChange={onChange} />);
    expect(container.querySelectorAll(".cm-checkbox")).toHaveLength(0);
  });
});
