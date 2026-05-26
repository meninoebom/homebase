import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
import type { WorkspaceSlotConfig } from "../lib/config";

// Mock the log module so WorkspaceSlot's useEffect doesn't try to touch
// real FSAccess during tests. readState/writeState are overridable per test
// (default to the in-memory store) so the error-path tests can reject. We
// declare the mock before importing the component (Vitest hoists vi.mock).
const stateStore = new Map<string, string>();
let mockReadState: (slot: string) => Promise<string>;
let mockWriteState: (slot: string, text: string) => Promise<void>;

vi.mock("../lib/log", () => ({
  readState: (slot: string) => mockReadState(slot),
  writeState: (slot: string, text: string) => mockWriteState(slot, text),
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
  mockReadState = (slot) => Promise.resolve(stateStore.get(slot) ?? "");
  mockWriteState = (slot, text) => {
    stateStore.set(slot, text);
    return Promise.resolve();
  };
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

  it("shows an inline error (and logs) when persistent state fails to load", async () => {
    mockReadState = () => Promise.reject(new DOMException("permission revoked", "NotAllowedError"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(
      <WorkspaceSlot config={baseConfig} initialDraft="" onDraft={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/couldn.t load state/i)).toBeInTheDocument();
    });
    // No editable surface rendered on a load failure.
    expect(container.querySelector("textarea")).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("shows 'save failed' (and logs) when a blur-save fails, keeping the text for retry", async () => {
    mockWriteState = () => Promise.reject(new DOMException("denied", "NotAllowedError"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(
      <WorkspaceSlot config={baseConfig} initialDraft="" onDraft={() => {}} />,
    );

    const textarea = await waitFor(() => {
      const el = container.querySelector("textarea");
      if (!el) throw new Error("textarea not loaded yet");
      return el;
    });

    // Edit (marks dirty) then blur to trigger the save.
    fireEvent.change(textarea, { target: { value: "new goals" } });
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(screen.getByText(/save failed:/i)).toBeInTheDocument();
    });
    // The user's text isn't discarded — they can retry.
    expect((container.querySelector("textarea") as HTMLTextAreaElement).value).toBe("new goals");
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
