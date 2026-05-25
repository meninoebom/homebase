import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { DayLoadError } from "./DayLoadError";

describe("DayLoadError", () => {
  it("warns against overwriting unreadable content and offers retry", () => {
    const onRetry = vi.fn();
    render(<DayLoadError onRetry={onRetry} />);
    expect(screen.getByText(/couldn.t be opened/i)).toBeInTheDocument();
    expect(screen.getByText(/overwrite it/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
