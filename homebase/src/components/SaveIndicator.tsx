// SaveIndicator — a 6px dot that pulses while saving and settles to a
// terracotta dot when saved (per the strategic-layer mock at
// .llm/design-strategic-layer/mock.html .save-indicator). Renders nothing
// when status is "idle". On "error", renders a darker terracotta dot
// without animation; the dot stays visible until the next successful save.
//
// Color values come from the route's CSS variables (--ink-ghost,
// --terracotta) so the indicator picks up the warm-cream Lapham palette
// when the strategic layer mounts.

import type { SaveStatus } from "../store/strategy";

interface SaveIndicatorProps {
  status: SaveStatus;
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "idle") return null;

  const base = "inline-block h-1.5 w-1.5 rounded-full align-middle";

  if (status === "saving") {
    return (
      <span
        aria-label="Saving"
        className={`${base} save-indicator-pulse`}
        style={{ background: "var(--ink-ghost, #C9C0B0)" }}
      />
    );
  }

  if (status === "saved") {
    return (
      <span
        aria-label="Saved"
        className={base}
        style={{ background: "var(--terracotta, #B8472D)", opacity: 0.5 }}
      />
    );
  }

  // error
  return (
    <span
      aria-label="Save failed — your edits are still in the editor"
      title="Save failed — your edits are still in the editor"
      className={base}
      style={{ background: "#8C341E", opacity: 0.85 }}
    />
  );
}
