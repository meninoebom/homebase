import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { makeNewSlot, PresetSection } from "./settings";
import { defaultConfig, layoutPresets, type HomebaseConfig } from "../lib/config";

describe("makeNewSlot", () => {
  it("generates prompt-1 in a config with no prompt-N slots", () => {
    const slot = makeNewSlot("prompt", defaultConfig());
    expect(slot.id).toBe("prompt-1");
    expect(slot.kind).toBe("prompt");
  });

  it("skips taken numbers when generating ids", () => {
    const config: HomebaseConfig = {
      ...defaultConfig(),
      slots: [
        { id: "prompt-1", kind: "prompt", prompt: "a" },
        { id: "prompt-2", kind: "prompt", prompt: "b" },
        { id: "prompt-4", kind: "prompt", prompt: "c" },
      ],
    };
    expect(makeNewSlot("prompt", config).id).toBe("prompt-3");
  });

  it("generates workspace-1 for the first workspace add", () => {
    const slot = makeNewSlot("workspace", defaultConfig());
    expect(slot.id).toBe("workspace-1");
    expect(slot.kind).toBe("workspace");
  });

  it("returns a valid SlotConfig with required fields populated", () => {
    const prompt = makeNewSlot("prompt", defaultConfig());
    if (prompt.kind === "prompt") {
      expect(prompt.prompt.length).toBeGreaterThan(0);
    }
    const workspace = makeNewSlot("workspace", defaultConfig());
    if (workspace.kind === "workspace") {
      expect(workspace.title.length).toBeGreaterThan(0);
    }
  });
});

describe("PresetSection", () => {
  const presets = layoutPresets();

  it("lists an Apply control for each starter practice", () => {
    render(<PresetSection onApply={() => {}} />);
    for (const preset of presets) {
      expect(screen.getByText(preset.title)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button", { name: /^apply$/i })).toHaveLength(presets.length);
  });

  it("warns before overwriting and does not apply until confirmed", () => {
    const onApply = vi.fn();
    render(<PresetSection onApply={onApply} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^apply$/i })[0]);
    // Confirmation copy appears; nothing applied yet.
    expect(screen.getByText(/that practice/i)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("applies the chosen preset after the user confirms", () => {
    const onApply = vi.fn();
    render(<PresetSection onApply={onApply} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^apply$/i })[1]);
    fireEvent.click(screen.getByRole("button", { name: /yes, apply/i }));
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0][0].id).toBe(presets[1].id);
  });

  it("cancels without applying", () => {
    const onApply = vi.fn();
    render(<PresetSection onApply={onApply} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^apply$/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText(/that practice/i)).not.toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("says the briefing and day-file content are left alone", () => {
    render(<PresetSection onApply={() => {}} />);
    expect(screen.getByText(/briefing and day-file content are left alone/i)).toBeInTheDocument();
  });
});
