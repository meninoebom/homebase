// Tests for FolderSectionView — the presentational surface. The container
// (FolderSection) wires the File System Access plumbing, untested by repo
// convention (jsdom has no showDirectoryPicker).

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { FolderSectionView } from "./FolderSection";

describe("FolderSectionView", () => {
  it("shows the connected folder name and how to find it", () => {
    render(<FolderSectionView folderName="Homebase" busy={false} onChange={() => {}} />);
    expect(screen.getByText(/Saving to/)).toHaveTextContent("Saving to Homebase/");
    expect(screen.getByText(/never where it lives/i)).toBeInTheDocument();
    expect(screen.getByText(/search Finder/i)).toBeInTheDocument();
  });

  it("fires onChange when Change folder is clicked", () => {
    const onChange = vi.fn();
    render(<FolderSectionView folderName="Homebase" busy={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /change folder/i }));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("disables the button and shows progress while busy", () => {
    render(<FolderSectionView folderName="Homebase" busy={true} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /opening/i })).toBeDisabled();
  });

  it("falls back to a generic label when the name is unresolved", () => {
    render(<FolderSectionView folderName={null} busy={false} onChange={() => {}} />);
    expect(screen.getByText(/Saving to/)).toHaveTextContent("your homebase folder");
  });
});
