// Tests for StarterPracticeChooser — the first-run practice picker. It's
// the one presentational piece of SetupGate; the surrounding gate wires the
// File System Access plumbing (jsdom has no showDirectoryPicker), untested
// by repo convention.

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { StarterPracticeChooser, UnsupportedBrowser } from "./SetupGate";
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

describe("UnsupportedBrowser", () => {
  it("tells a desktop visitor which browsers work", () => {
    render(<UnsupportedBrowser mobile={false} />);
    expect(screen.getByText(/needs a Chromium browser/i)).toBeInTheDocument();
    expect(screen.getByText(/Chrome, Edge, Brave, Arc, and Opera/i)).toBeInTheDocument();
  });

  it("does not promise Safari and Firefox support is coming", () => {
    render(<UnsupportedBrowser mobile={false} />);
    // The old copy said they "don't yet" support it. Both vendors have
    // formally declined, so "yet" was a promise the platform won't keep.
    expect(screen.queryByText(/don't yet|doesn't yet|not yet/i)).not.toBeInTheDocument();
    expect(screen.getByText(/declined to implement/i)).toBeInTheDocument();
  });

  it("tells a phone visitor the device is the problem, not the browser", () => {
    render(<UnsupportedBrowser mobile={true} />);
    expect(screen.getByText(/needs a desktop/i)).toBeInTheDocument();
    expect(screen.getByText(/including Chrome on Android/i)).toBeInTheDocument();
  });

  it("always offers a way to read what Homebase is", () => {
    for (const mobile of [true, false]) {
      const { unmount } = render(<UnsupportedBrowser mobile={mobile} />);
      expect(screen.getByRole("link", { name: /what Homebase is/i })).toHaveAttribute(
        "href",
        expect.stringContaining("welcome"),
      );
      unmount();
    }
  });

  it("offers a phone visitor a way to carry the link to a desktop", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    render(<UnsupportedBrowser mobile={true} />);
    fireEvent.click(screen.getByRole("button", { name: /copy link/i }));

    expect(writeText).toHaveBeenCalledWith("https://homebase.you/");
    vi.unstubAllGlobals();
  });

  it("omits the copy button on desktop, where it would be pointless", () => {
    render(<UnsupportedBrowser mobile={false} />);
    expect(screen.queryByRole("button", { name: /copy link/i })).not.toBeInTheDocument();
  });
});
