// Dreams slot component tests. Exercises the slot's contract with the
// morning runner (renders header, calls onDraft on change, respects
// initialDraft) without touching Tauri or the Zustand store.

import { describe, expect, it, vi } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DreamsSlot } from "./index";

describe("DreamsSlot", () => {
  it("renders the Dreams header", () => {
    render(<DreamsSlot mode="morning" initialDraft="" onDraft={() => {}} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Dreams");
  });

  it("initializes the textarea with initialDraft", () => {
    render(<DreamsSlot mode="morning" initialDraft="A dream about the sea." onDraft={() => {}} />);
    const textarea = screen.getByRole("textbox", { name: "Dreams" });
    expect(textarea).toHaveValue("A dream about the sea.");
  });

  it("calls onDraft when the user types", async () => {
    const onDraft = vi.fn();
    const user = userEvent.setup();
    render(<DreamsSlot mode="morning" initialDraft="" onDraft={onDraft} />);
    const textarea = screen.getByRole("textbox", { name: "Dreams" });
    await user.type(textarea, "sea");
    // Each keystroke fires onChange and therefore onDraft. We don't assert
    // the exact count because React batching can coalesce events in test
    // runners; we just care that the final value reached onDraft.
    expect(onDraft).toHaveBeenCalled();
    expect(onDraft).toHaveBeenLastCalledWith("sea");
  });

  it("accepts empty completion (skipping is indistinguishable from filling)", () => {
    const onDraft = vi.fn();
    render(<DreamsSlot mode="morning" initialDraft="" onDraft={onDraft} />);
    const textarea = screen.getByRole("textbox", { name: "Dreams" });
    // An untouched textarea is a valid "done" state — the morning runner's
    // Cmd-Enter handler is allowed to call onComplete with empty body.
    expect(textarea).toHaveValue("");
  });
});
