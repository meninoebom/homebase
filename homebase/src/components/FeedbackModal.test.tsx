import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { FeedbackLink, FeedbackModal, FEEDBACK_EMAIL } from "./FeedbackModal";

describe("FeedbackModal", () => {
  it("renders a Feedback button trigger", () => {
    render(<FeedbackLink onOpen={() => {}} />);
    expect(screen.getByRole("button", { name: /feedback/i })).toBeInTheDocument();
  });

  it("does not show the modal when closed", () => {
    render(<FeedbackModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the dialog when open", () => {
    render(<FeedbackModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders a mailto link pointing to the feedback email constant", () => {
    render(<FeedbackModal isOpen={true} onClose={() => {}} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", expect.stringContaining(FEEDBACK_EMAIL));
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(<FeedbackModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<FeedbackModal isOpen={true} onClose={onClose} />);
    // The backdrop is the outer div with data-testid="feedback-backdrop"
    fireEvent.click(screen.getByTestId("feedback-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close when clicking the dialog itself", () => {
    const onClose = vi.fn();
    render(<FeedbackModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("FEEDBACK_EMAIL constant", () => {
  it("is a non-empty string", () => {
    expect(typeof FEEDBACK_EMAIL).toBe("string");
    expect(FEEDBACK_EMAIL.length).toBeGreaterThan(0);
  });
});
