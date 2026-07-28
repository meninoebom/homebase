// The route component wires router + clipboard + filesystem; the presentational
// IntegrationsContent is the exported seam we render here (same convention as
// day.test.tsx).

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { IntegrationsContent } from "./integrations";

function renderContent(overrides: Partial<Parameters<typeof IntegrationsContent>[0]> = {}) {
  const props = {
    onBack: vi.fn(),
    onCopyPrimer: vi.fn(),
    onCopyDigest: vi.fn(),
    primerCopied: false,
    digestCopied: false,
    digestBusy: false,
    digestError: null,
    primerError: null,
    ...overrides,
  };
  render(<IntegrationsContent {...props} />);
  return props;
}

describe("IntegrationsContent", () => {
  it("explains the local-first, point-your-own-AI pitch", () => {
    renderContent();
    expect(screen.getByRole("heading", { name: /use your homebase with ai/i })).toBeInTheDocument();
    // The privacy promise is the point — assert it's present.
    expect(screen.getByText(/nothing leaves your machine/i)).toBeInTheDocument();
  });

  it("copies the primer when the primer button is clicked", () => {
    const { onCopyPrimer } = renderContent();
    fireEvent.click(screen.getByTestId("copy-primer"));
    expect(onCopyPrimer).toHaveBeenCalledOnce();
  });

  it("copies the digest when the digest button is clicked", () => {
    const { onCopyDigest } = renderContent();
    fireEvent.click(screen.getByTestId("copy-digest"));
    expect(onCopyDigest).toHaveBeenCalledOnce();
  });

  it("reflects the copied state on the primer button", () => {
    renderContent({ primerCopied: true });
    expect(screen.getByTestId("copy-primer")).toHaveTextContent(/copied/i);
  });

  it("disables the digest button and shows progress while gathering", () => {
    renderContent({ digestBusy: true });
    const button = screen.getByTestId("copy-digest");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/gathering/i);
  });

  it("surfaces a digest error when the folder can't be read", () => {
    renderContent({ digestError: "Couldn't read your folder just now. Try again in a moment." });
    expect(screen.getByText(/couldn.t read your folder/i)).toBeInTheDocument();
  });

  it("surfaces a clipboard failure on the primer instead of looking inert", () => {
    renderContent({ primerError: "Couldn't reach your clipboard." });
    expect(screen.getByText(/couldn.t reach your clipboard/i)).toBeInTheDocument();
  });

  it("navigates back when Done is clicked", () => {
    const { onBack } = renderContent();
    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
