import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { HorizonLoadError } from "./HorizonLoadError";

describe("HorizonLoadError", () => {
  it("renders an alert that warns against overwriting unreadable content", () => {
    render(<HorizonLoadError />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/couldn.t be opened/i);
    expect(alert).toHaveTextContent(/overwrit/i);
  });

  it("offers a Try again button when onRetry is provided and fires it", () => {
    const onRetry = vi.fn();
    render(<HorizonLoadError onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("omits the button when no onRetry is given", () => {
    render(<HorizonLoadError />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
