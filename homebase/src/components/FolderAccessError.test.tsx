import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { FolderAccessError } from "./FolderAccessError";

describe("FolderAccessError", () => {
  it("explains the folder is unreachable, reassures data is safe, and offers retry", () => {
    const onRetry = vi.fn();
    render(<FolderAccessError onRetry={onRetry} />);
    expect(screen.getByText(/can.t reach your folder/i)).toBeInTheDocument();
    expect(screen.getByText(/safe on disk/i)).toBeInTheDocument();
    expect(screen.getByText(/reconnect the folder/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
