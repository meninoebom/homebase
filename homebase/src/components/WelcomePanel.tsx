// One-time first-run welcome on the strategic accordion.
//
// Greets a brand-new user, then gets out of the way — an explicit dismiss
// control here, plus the ritual store clears the flag on the first save. Lives
// in the warm "cover" room (bone paper, marigold accent, Inter Tight); see
// CLAUDE.md "Two rooms, two registers." Replaces the invisible example.md seed.

interface WelcomePanelProps {
  onDismiss: () => void;
}

export function WelcomePanel({ onDismiss }: WelcomePanelProps) {
  return (
    <section
      aria-label="Welcome to Homebase"
      className="relative mb-12"
      style={{
        background: "var(--paper-3)",
        borderLeft: "2px solid var(--accent-2)",
        padding: "26px 30px",
      }}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss welcome"
        className="absolute cursor-pointer border-0 bg-transparent p-0 transition-colors hover:text-[var(--ink-1)]"
        style={{
          top: "18px",
          right: "20px",
          fontFamily: "var(--font-sans-ui)",
          fontSize: "20px",
          lineHeight: 1,
          color: "var(--ink-4)",
        }}
      >
        ×
      </button>

      <div
        style={{
          fontFamily: "var(--font-sans-ui)",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--accent-2)",
        }}
      >
        New here
      </div>

      <h2
        className="mt-3"
        style={{
          fontFamily: "var(--font-serif-display)",
          fontWeight: 600,
          fontSize: "30px",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: "var(--ink-1)",
          margin: 0,
        }}
      >
        Welcome to Homebase.
      </h2>

      <p
        className="mt-3.5"
        style={{
          fontFamily: "var(--font-sans-ui)",
          fontSize: "16px",
          fontWeight: 400,
          lineHeight: 1.55,
          color: "var(--ink-2)",
          maxWidth: "56ch",
          margin: 0,
        }}
      >
        A quiet place to think — at the scale of a life, a year, a week, a day. Write anywhere; it
        all saves as plain text in the folder you chose. Begin wherever you like.
      </p>

      <a
        href="/about"
        className="mt-5 inline-flex items-center gap-2 transition-colors hover:text-[var(--ink-1)]"
        style={{
          fontFamily: "var(--font-sans-ui)",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--ink-3)",
          textDecoration: "none",
        }}
      >
        Read the guide
        <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}
