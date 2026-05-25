// Tests for FolderSettingsView — the presentational surface. The container
// (FolderSettings) wires the File System Access plumbing, which is smoke-tested
// during the first-run flow rather than unit-tested (same convention as
// strategy-fs: test the pure surface, not the FSAccess + IDB plumbing).

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { FolderSettingsView } from "./FolderSettings";

const noop = () => {};

describe("FolderSettingsView", () => {
  it("shows the connected folder name and both subfolders", () => {
    render(
      <FolderSettingsView
        state={{ kind: "connected", rootName: "Homebase" }}
        busy={false}
        onChoose={noop}
        onReconnect={noop}
      />,
    );
    expect(screen.getByTestId("root-name")).toHaveTextContent("Homebase/");
    expect(screen.getByText(/Homebase\/strategy\//)).toBeInTheDocument();
    expect(screen.getByText(/Homebase\/log\//)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change folder/i })).toBeInTheDocument();
  });

  it("explains the path is not exposed and tells the user how to find it", () => {
    render(
      <FolderSettingsView
        state={{ kind: "connected", rootName: "Homebase" }}
        busy={false}
        onChoose={noop}
        onReconnect={noop}
      />,
    );
    expect(screen.getByText(/never its full path/i)).toBeInTheDocument();
    expect(screen.getByText(/search Finder/i)).toBeInTheDocument();
  });

  it("fires onChoose when Change folder is clicked", () => {
    const onChoose = vi.fn();
    render(
      <FolderSettingsView
        state={{ kind: "connected", rootName: "Homebase" }}
        busy={false}
        onChoose={onChoose}
        onReconnect={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /change folder/i }));
    expect(onChoose).toHaveBeenCalledOnce();
  });

  it("disconnected without a saved folder offers only Choose folder", () => {
    render(
      <FolderSettingsView
        state={{ kind: "disconnected", hasSaved: false }}
        busy={false}
        onChoose={noop}
        onReconnect={noop}
      />,
    );
    expect(screen.getByRole("button", { name: /choose folder/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /re-use saved folder/i })).not.toBeInTheDocument();
  });

  it("disconnected with a saved folder also offers Re-use saved folder", () => {
    const onReconnect = vi.fn();
    render(
      <FolderSettingsView
        state={{ kind: "disconnected", hasSaved: true }}
        busy={false}
        onChoose={noop}
        onReconnect={onReconnect}
      />,
    );
    const reuse = screen.getByRole("button", { name: /re-use saved folder/i });
    fireEvent.click(reuse);
    expect(onReconnect).toHaveBeenCalledOnce();
  });

  it("disables actions while busy", () => {
    render(
      <FolderSettingsView
        state={{ kind: "connected", rootName: "Homebase" }}
        busy={true}
        onChoose={noop}
        onReconnect={noop}
      />,
    );
    expect(screen.getByRole("button", { name: /opening/i })).toBeDisabled();
  });

  it("shows a transient checking state", () => {
    render(
      <FolderSettingsView
        state={{ kind: "checking" }}
        busy={false}
        onChoose={noop}
        onReconnect={noop}
      />,
    );
    expect(screen.getByText(/Checking/i)).toBeInTheDocument();
  });

  it("shows a Chromium message when unsupported", () => {
    render(
      <FolderSettingsView
        state={{ kind: "unsupported" }}
        busy={false}
        onChoose={noop}
        onReconnect={noop}
      />,
    );
    expect(screen.getByText(/Chromium browsers/i)).toBeInTheDocument();
  });
});
