import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
import type { WorkspaceSlotConfig } from "../lib/config";

// Mock the log module so WorkspaceSlot's useEffect doesn't try to touch
// real FSAccess during tests. Each test seeds the in-memory store before
// rendering. We need to declare the mock before importing the component
// (Vitest hoists vi.mock).
const stateStore = new Map<string, string>();

vi.mock("../lib/log", () => ({
  readState: (slot: string) => Promise.resolve(stateStore.get(slot) ?? ""),
  writeState: (slot: string, text: string) => {
    stateStore.set(slot, text);
    return Promise.resolve();
  },
}));

// Import AFTER the mock so the component picks up the mocked module.
const { WorkspaceSlot } = await import("./WorkspaceSlot");

const baseConfig: WorkspaceSlotConfig = {
  id: "test-workspace",
  kind: "workspace",
  title: "Test Workspace",
};

beforeEach(() => {
  stateStore.clear();
});

describe("WorkspaceSlot", () => {
  it("loads persistent state and renders it in the textarea", async () => {
    stateStore.set("test-workspace", "saved goals");
    const { container } = render(
      <WorkspaceSlot config={baseConfig} initialDraft="" onDraft={() => {}} />,
    );
    await waitFor(() => {
      const textarea = container.querySelector("textarea");
      expect(textarea?.value).toBe("saved goals");
    });
  });

  it("renders the default state label when none is configured", async () => {
    stateStore.set("test-workspace", "");
    render(<WorkspaceSlot config={baseConfig} initialDraft="" onDraft={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Editable and persistent")).toBeInTheDocument();
    });
  });

  it("renders a custom state label when configured", async () => {
    stateStore.set("custom", "");
    render(
      <WorkspaceSlot
        config={{ ...baseConfig, id: "custom", stateLabel: "Working on" }}
        initialDraft=""
        onDraft={() => {}}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("Working on")).toBeInTheDocument();
    });
  });

  it("renders the today section only when prompt is configured", async () => {
    stateStore.set("test-workspace", "");
    const { container, rerender } = render(
      <WorkspaceSlot config={baseConfig} initialDraft="" onDraft={() => {}} />,
    );
    await waitFor(() => screen.getByText("Editable and persistent"));
    expect(screen.queryByText("Today")).not.toBeInTheDocument();

    stateStore.set("with-prompt", "");
    rerender(
      <WorkspaceSlot
        config={{ ...baseConfig, id: "with-prompt", prompt: "What did you do?" }}
        initialDraft=""
        onDraft={() => {}}
      />,
    );
    await waitFor(() => screen.getByText("Today"));
    const placeholder = container.querySelector(".cm-placeholder");
    expect(placeholder?.textContent).toBe("What did you do?");
  });

  it("renders nothing while persistent state is loading", () => {
    // No await: the readState promise is still pending on first render.
    // Component returns null until loaded, so the textarea isn't there yet.
    const { container } = render(
      <WorkspaceSlot config={baseConfig} initialDraft="" onDraft={() => {}} />,
    );
    expect(container.querySelector("textarea")).toBeNull();
  });
});
