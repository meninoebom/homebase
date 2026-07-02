// Tests for StarterPracticeChooser — the first-run practice picker. It's
// the one presentational piece of SetupGate; the surrounding gate wires the
// File System Access plumbing (jsdom has no showDirectoryPicker), untested
// by repo convention.

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { StarterPracticeChooser } from "./SetupGate";
import { layoutPresets } from "../lib/config";

describe("StarterPracticeChooser", () => {
  const presets = layoutPresets();

  it("lists every starter practice with its description", () => {
    render(
      <StarterPracticeChooser
        presets={presets}
        defaultPresetId="morning-ritual"
        onChoose={() => {}}
      />,
    );
    for (const preset of presets) {
      expect(screen.getByText(preset.title)).toBeInTheDocument();
      expect(screen.getByText(preset.description)).toBeInTheDocument();
    }
  });

  it("preselects the default preset so clicking straight through keeps today's behavior", () => {
    render(
      <StarterPracticeChooser
        presets={presets}
        defaultPresetId="morning-ritual"
        onChoose={() => {}}
      />,
    );
    const radio = screen.getByRole("radio", { name: /morning ritual/i });
    expect(radio).toBeChecked();
    expect(screen.getByRole("button", { name: /start with morning ritual/i })).toBeInTheDocument();
  });

  it("calls onChoose with the default when Start is clicked without changing selection", () => {
    const onChoose = vi.fn();
    render(
      <StarterPracticeChooser
        presets={presets}
        defaultPresetId="morning-ritual"
        onChoose={onChoose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /start with morning ritual/i }));
    expect(onChoose).toHaveBeenCalledOnce();
    expect(onChoose.mock.calls[0][0].id).toBe("morning-ritual");
  });

  it("calls onChoose with the practice the user selects", () => {
    const onChoose = vi.fn();
    render(
      <StarterPracticeChooser
        presets={presets}
        defaultPresetId="morning-ritual"
        onChoose={onChoose}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: /evening shutdown/i }));
    fireEvent.click(screen.getByRole("button", { name: /start with evening shutdown/i }));
    expect(onChoose).toHaveBeenCalledOnce();
    expect(onChoose.mock.calls[0][0].id).toBe("evening-shutdown");
  });

  it("explains that the choice is only a starting point", () => {
    render(
      <StarterPracticeChooser
        presets={presets}
        defaultPresetId="morning-ritual"
        onChoose={() => {}}
      />,
    );
    expect(screen.getByText(/starting point/i)).toBeInTheDocument();
  });
});
