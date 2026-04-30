import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { HorizonInvitation } from "./HorizonInvitation";

describe("HorizonInvitation", () => {
  it("renders the life-values invitation", () => {
    render(<HorizonInvitation horizon="life-values" />);
    expect(screen.getByText(/How do you want to live/)).toBeInTheDocument();
    expect(screen.getByText(/Begin anywhere/)).toBeInTheDocument();
  });

  it("renders the life-goals invitation", () => {
    render(<HorizonInvitation horizon="life-goals" />);
    expect(screen.getByText(/What are you aiming at/)).toBeInTheDocument();
    expect(screen.getByText(/pull you forward/)).toBeInTheDocument();
  });

  it("renders 'No previous year to carry from' for year horizon", () => {
    render(<HorizonInvitation horizon="year" />);
    expect(screen.getByText(/No previous year to carry from/)).toBeInTheDocument();
  });

  it("renders 'No previous month to carry from' for month horizon", () => {
    render(<HorizonInvitation horizon="month" />);
    expect(screen.getByText(/No previous month to carry from/)).toBeInTheDocument();
  });

  it("renders 'No previous week to carry from' for week horizon", () => {
    render(<HorizonInvitation horizon="week" />);
    expect(screen.getByText(/No previous week to carry from/)).toBeInTheDocument();
  });

  it("includes the ⌘ ↩ keyboard hint for time-bound horizons", () => {
    const { container } = render(<HorizonInvitation horizon="month" />);
    expect(container.textContent).toContain("⌘");
    expect(container.textContent).toContain("↩");
    expect(screen.getByText(/Press/)).toBeInTheDocument();
  });
});
