// CarryOverBanner — magazine marginalia for "this content was carried
// from a prior period." The closest spiritual precedent for this UX is
// Sunsama's per-item Extend button on weekly objectives, but theirs is
// per-item and ours is per-document — so we invented our own register:
//
//   ※   *Carried from <strong>April 2026</strong> — review and edit, or
//       <span class="clear">clear</span>.*
//   ──── (dotted hairline)
//
// The reference mark (※, asterism — the glyph Lapham uses for footnote
// callouts) sits in the left margin in terracotta. Body is italic
// Newsreader 14px in --ink-muted; the "clear" link is dotted-underlined
// terracotta, darkening to #8C341E on hover. Dotted hairline below
// marks the end of the marginalia register so the editor below it
// reads as content, not continuation.
//
// Behavior: parent (HorizonRow) only mounts this when state.carryOver
// is non-null. First content edit dismisses it via setContent → store
// clears carryOver → parent unmounts the banner.

import { PeriodKey, type Horizon } from "../lib/period-key";

interface Props {
  horizon: Horizon;
  sourcePeriod: string;
  onClear: () => void;
}

export function CarryOverBanner({ horizon, sourcePeriod, onClear }: Props) {
  const sourceLabel = PeriodKey.format(horizon, sourcePeriod);
  return (
    <div
      className="carry-over-banner relative mb-3 max-w-[62ch] pb-3"
      title="Carry over: content brought forward from a past period so you can pick up where you left off."
      style={{ borderBottom: "1px dotted var(--hairline-2, #D9D2C0)" }}
    >
      <span
        aria-hidden="true"
        className="absolute left-[-22px] top-[2px] font-sans text-[12px]"
        style={{ color: "var(--terracotta, #B8472D)" }}
      >
        ※
      </span>
      <p
        className="font-serif text-[16px] italic leading-[1.55]"
        style={{ color: "var(--ink-muted, #7A7268)" }}
      >
        Carried from <strong className="not-italic">{sourceLabel}</strong> — review and edit, or{" "}
        <button
          type="button"
          onClick={onClear}
          className="carry-over-clear cursor-pointer border-b border-dotted bg-transparent p-0 align-baseline not-italic"
          style={{
            color: "var(--terracotta, #B8472D)",
            borderColor: "var(--terracotta, #B8472D)",
            font: "inherit",
            fontStyle: "normal",
          }}
        >
          clear
        </button>
        .
      </p>
    </div>
  );
}
