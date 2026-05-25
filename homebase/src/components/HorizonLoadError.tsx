// HorizonLoadError — shown in place of a horizon's content when its file
// failed to load with a real error (not a missing file, which the fs layer
// maps to an empty horizon). It replaces the "begin anywhere" invitation so
// the user is NOT invited to type into what looks like a blank horizon and
// overwrite content that's merely unreadable right now (#80).
//
// Presentational: the row's loadError state lives in the strategy store; this
// just renders the warning and an optional retry that re-runs the load.

export function HorizonLoadError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded"
      style={{
        border: "1px solid var(--accent-1)",
        background: "var(--paper-2)",
        padding: "14px 16px",
      }}
    >
      <p
        className="font-serif"
        style={{ fontSize: "15px", lineHeight: 1.55, color: "var(--ink-1)" }}
      >
        This file couldn’t be opened. Its content may still be on disk — don’t edit here until it
        loads, or you risk overwriting it. Check that the folder is still connected (Customize →
        Your folder), then try again.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 cursor-pointer border-0 bg-transparent p-0 py-1"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--accent-1)",
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
