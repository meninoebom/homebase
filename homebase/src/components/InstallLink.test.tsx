// Tests for InstallLink. The install prompt is Chromium-only and jsdom never
// fires it, so the tests dispatch a stand-in `beforeinstallprompt` event —
// enough to cover the visibility rules, which are the whole logic here.

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { InstallLink } from "./InstallLink";

function fireInstallPrompt(prompt = vi.fn().mockResolvedValue(undefined)) {
  const event = new Event("beforeinstallprompt") as Event & { prompt: unknown };
  event.prompt = prompt;
  act(() => {
    window.dispatchEvent(event);
  });
  return prompt;
}

const installButton = () => screen.queryByRole("button", { name: /install/i });

describe("InstallLink", () => {
  it("renders nothing until the browser offers an install", () => {
    render(<InstallLink />);
    expect(installButton()).not.toBeInTheDocument();
  });

  it("appears once beforeinstallprompt fires", () => {
    render(<InstallLink />);
    fireInstallPrompt();
    expect(installButton()).toBeInTheDocument();
  });

  it("triggers the native prompt on click", () => {
    render(<InstallLink />);
    const prompt = fireInstallPrompt();

    fireEvent.click(screen.getByRole("button", { name: /install/i }));

    expect(prompt).toHaveBeenCalledOnce();
  });

  it("hides itself after prompting, since the captured event is single-use", () => {
    render(<InstallLink />);
    fireInstallPrompt();

    fireEvent.click(screen.getByRole("button", { name: /install/i }));

    expect(installButton()).not.toBeInTheDocument();
  });

  it("hides itself once the app reports being installed", () => {
    render(<InstallLink />);
    fireInstallPrompt();

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(installButton()).not.toBeInTheDocument();
  });
});
