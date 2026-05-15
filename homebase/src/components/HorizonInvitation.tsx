// HorizonInvitation — the empty-state block shown above the editor for a
// row that has no content yet (and, for time-bound horizons, no carry-over
// candidate either). The page is a real page, not a form: italic prose
// in --ink-ghost names the situation, suggests one thing to do, and shows
// the ⌘↩ keyboard hint. Auto-dismisses on first keystroke since the
// parent (HorizonRow) only renders this when row.content === "".
//
// Wording per plan §F-Polish-empty-states:
//   - Time-bound (no history at all): "No previous [week] to carry from.
//                                       Write what this [period] is for —
//                                       one paragraph or a few bullets —
//                                       or come back later."
//   - life-values: "How do you want to live? Begin anywhere."
//   - life-goals:  "What are you aiming at? List the things that pull
//                    you forward."

import type { Horizon } from "../lib/period-key";

interface Props {
  horizon: Horizon;
}

const PERIOD_NOUN: Record<"year" | "month" | "week", string> = {
  year: "year",
  month: "month",
  week: "week",
};

export function HorizonInvitation({ horizon }: Props) {
  if (horizon === "life-values") {
    return (
      <Block>
        <em>How do you want to live?</em> Begin anywhere.
      </Block>
    );
  }
  if (horizon === "life-goals") {
    return (
      <Block>
        <em>What are you aiming at?</em> List the things that pull you forward.
      </Block>
    );
  }
  // Time-bound (year, month, week) with no carry-over candidate.
  const noun = PERIOD_NOUN[horizon];
  return (
    <Block>
      No previous {noun} to carry from. Write what this {noun} is for — one paragraph or a few
      bullets — or come back later. Press <Key>⌘</Key>
      <Key>↩</Key> to save.
    </Block>
  );
}

function Block({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="horizon-invitation mb-3 max-w-[62ch] font-serif text-[18px] italic leading-[1.5]"
      style={{ color: "var(--ink-ghost, #C9C0B0)" }}
    >
      {children}
    </p>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mx-[3px] inline-block px-[7px] py-[2px] font-sans text-[10px] uppercase tracking-[0.1em] not-italic"
      style={{
        color: "var(--ink-faint, #A39A8A)",
        border: "1px solid var(--hairline-2, #D9D2C0)",
        borderRadius: "3px",
      }}
    >
      {children}
    </span>
  );
}
