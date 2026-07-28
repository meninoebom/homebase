// FeedbackModal — a reusable feedback link + dismissable modal.
//
// The modal body is a mailto: link built from a single build-time constant
// (FEEDBACK_EMAIL). To swap to a hosted form in the future, update the
// constant and the modal body — nothing else changes.
//
// Design rooms (per CLAUDE.md "Two rooms, two registers"):
//   - Strategic accordion (/) — warm bone surface, marigold accent, uppercase
//     small-caps label. FeedbackLink accepts a `variant` prop to match.
//   - Day surface (/day) — white surface, gray text, 13px/600 weight.
//
// A11y:
//   - role="dialog" + aria-modal="true" on the dialog panel.
//   - Esc closes via keydown listener on document.
//   - Backdrop click closes; click on the panel itself does not.
//   - Focus moves to the close button on open.

import { useEffect, useRef } from "react";

export const FEEDBACK_EMAIL = "afrobot@gmail.com";

const MAILTO_HREF = `mailto:${FEEDBACK_EMAIL}?subject=Homebase%20feedback`;

// ─── FeedbackLink ────────────────────────────────────────────────────────────

interface FeedbackLinkProps {
  onOpen: () => void;
  /** "strategic" = warm bone / marigold register (/); "day" = white register (/day). */
  variant?: "strategic" | "day";
}

export function FeedbackLink({ onOpen, variant = "day" }: FeedbackLinkProps) {
  const isStrategic = variant === "strategic";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="cursor-pointer border-0 bg-transparent p-0 transition-colors"
      style={
        isStrategic
          ? {
              fontFamily: "var(--font-sans-ui)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }
          : {
              fontSize: "13px",
              fontWeight: 600,
              color: "#6B7280",
            }
      }
    >
      Feedback
    </button>
  );
}

// ─── FeedbackModal ───────────────────────────────────────────────────────────

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      data-testid="feedback-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      {/* Dialog panel — stop propagation so clicks inside don't close */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper-1, #ECE6DA)",
          borderRadius: "4px",
          padding: "32px 36px",
          maxWidth: "480px",
          width: "90vw",
          position: "relative",
          fontFamily: "var(--font-sans-ui, 'Inter Tight', sans-serif)",
        }}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close feedback modal"
          style={{
            position: "absolute",
            top: "12px",
            right: "14px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            lineHeight: 1,
            color: "var(--ink-3, #7A7268)",
          }}
        >
          ×
        </button>

        <h2
          id="feedback-modal-title"
          style={{
            margin: "0 0 12px",
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--ink-1, #1A1613)",
            letterSpacing: "-0.02em",
          }}
        >
          Send feedback
        </h2>

        <p
          style={{
            margin: "0 0 20px",
            fontSize: "14px",
            lineHeight: 1.55,
            color: "var(--ink-2, #3D3830)",
          }}
        >
          Found a bug or have an idea? Send an email — it goes straight to the person building this.
        </p>

        {/* The address stays in the mailto (that's what makes the link work)
            but is no longer printed as body text: a personal inbox rendered in
            full on a public page is a standing invitation to scrapers. */}
        <a
          href={MAILTO_HREF}
          style={{
            display: "inline-block",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--accent-2, #C18A2A)",
            textDecoration: "underline",
            letterSpacing: "-0.01em",
          }}
        >
          Write an email
        </a>
      </div>
    </div>
  );
}
