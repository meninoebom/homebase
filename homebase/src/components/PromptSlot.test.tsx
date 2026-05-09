import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { PromptSlot } from "./PromptSlot";
import type { PromptSlotConfig } from "../lib/config";

const baseConfig: PromptSlotConfig = {
  id: "test",
  kind: "prompt",
  prompt: "Test prompt placeholder",
};

describe("PromptSlot", () => {
  it("renders the prompt as the editor placeholder", () => {
    const { container } = render(
      <PromptSlot config={baseConfig} initialDraft="" onDraft={() => {}} />,
    );
    const placeholder = container.querySelector(".cm-placeholder");
    expect(placeholder?.textContent).toBe("Test prompt placeholder");
  });

  it("renders hints joined by ' · ' when present", () => {
    render(
      <PromptSlot
        config={{ ...baseConfig, hints: ["one", "two", "three"] }}
        initialDraft=""
        onDraft={() => {}}
      />,
    );
    expect(screen.getByText("one · two · three")).toBeInTheDocument();
  });

  it("renders no hints row when hints is undefined or empty", () => {
    const { container: a } = render(
      <PromptSlot config={baseConfig} initialDraft="" onDraft={() => {}} />,
    );
    expect(a.querySelectorAll("p").length).toBe(0);

    const { container: b } = render(
      <PromptSlot
        config={{ ...baseConfig, hints: [] }}
        initialDraft=""
        onDraft={() => {}}
      />,
    );
    expect(b.querySelectorAll("p").length).toBe(0);
  });

  it("renders initialDraft into the editor", () => {
    render(
      <PromptSlot
        config={baseConfig}
        initialDraft="The demo is tomorrow."
        onDraft={() => {}}
      />,
    );
    expect(screen.getByText("The demo is tomorrow.")).toBeInTheDocument();
  });

  it("does not render the title in the slot itself (parent owns titles)", () => {
    render(
      <PromptSlot
        config={{ ...baseConfig, title: "My Section" }}
        initialDraft=""
        onDraft={() => {}}
      />,
    );
    expect(screen.queryByText("My Section")).not.toBeInTheDocument();
  });
});
