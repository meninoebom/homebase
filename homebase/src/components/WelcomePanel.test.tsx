import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { WelcomePanel } from "./WelcomePanel";

describe("WelcomePanel", () => {
  it("renders the welcome heading and invitation", () => {
    render(<WelcomePanel onDismiss={() => {}} />);
    expect(screen.getByRole("heading", { name: /welcome to homebase/i })).toBeInTheDocument();
    expect(screen.getByText(/begin wherever you like/i)).toBeInTheDocument();
  });

  it("calls onDismiss when the dismiss control is clicked", () => {
    const onDismiss = vi.fn();
    render(<WelcomePanel onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss welcome/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("links to the guide", () => {
    render(<WelcomePanel onDismiss={() => {}} />);
    expect(screen.getByRole("link", { name: /read the guide/i })).toHaveAttribute("href", "/about");
  });
});
