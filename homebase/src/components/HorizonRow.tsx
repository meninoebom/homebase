// HorizonRow — one row of the strategic accordion.
//
// Three variants based on `horizon`:
//
//   - Persistent (life-values, life-goals): header → expanded body with
//     MarkdownEditor + SaveIndicator. No banner, no portal.
//
//   - Time-bound (year, month, week): header → expanded body with the
//     carry-over banner (when state.carryOver is non-null) above
//     MarkdownEditor + SaveIndicator.
//
//   - Day: header is a portal — clicking it triggers `onDayClick`
//     (route navigation lands in #11). No expand body ever.
//
// Layout matches .llm/design-strategic-layer/mock.html .row-head:
//
//   [ i. ]   Italic Newsreader title       Metadata col   [ + / → ]
//
// CSS variables (--page, --ink, --terracotta, --hairline, etc.) come
// from the StrategyAccordion route container in #9; tasteful fallbacks
// live in this component for isolated rendering / tests.

import { useEffect } from "react";
import { CarryOverBanner } from "./CarryOverBanner";
import { MarkdownEditor } from "./MarkdownEditor";
import { SaveIndicator } from "./SaveIndicator";
import { useAutosave } from "../hooks/useAutosave";
import { PeriodKey, type Horizon } from "../lib/period-key";
import { useStrategyStore } from "../store/strategy";

const ROMAN: Record<Horizon | "day", string> = {
  "life-values": "i.",
  "life-goals": "ii.",
  year: "iii.",
  month: "iv.",
  week: "v.",
  day: "vi.",
};

const TITLE: Record<Horizon | "day", string> = {
  "life-values": "Life values",
  "life-goals": "Life goals",
  year: "Year",
  month: "Month",
  week: "Week",
  day: "Day",
};

const PLACEHOLDER: Record<Horizon, string> = {
  "life-values": "How do you want to live? Begin anywhere.",
  "life-goals": "What are you aiming at? List the things that pull you forward.",
  year: "What is this year for?",
  month: "What is this month about?",
  week: "What is this week for?",
};

/** Metadata text shown in the header's right column. */
function metaFor(horizon: Horizon | "day"): string {
  if (horizon === "day") return "Open morning ritual";
  if (horizon === "life-values" || horizon === "life-goals") return "Persistent";
  const key = PeriodKey.current(horizon);
  if (!key) return "";
  return PeriodKey.format(horizon, key);
}

interface HorizonRowProps {
  horizon: Horizon | "day";
  onDayClick?: () => void;
}

export function HorizonRow(props: HorizonRowProps) {
  if (props.horizon === "day") {
    return <DayRow onDayClick={props.onDayClick} />;
  }
  return <StrategyRow horizon={props.horizon} />;
}

// -- Day row (portal) ----------------------------------------------------

function DayRow({ onDayClick }: { onDayClick?: () => void }) {
  return (
    <div className="row-day border-b" style={{ borderColor: "var(--hairline, #E5DFD3)" }}>
      <button
        type="button"
        onClick={onDayClick}
        className="day-row-button group grid w-full cursor-pointer items-baseline px-0 py-[22px] text-left transition-colors hover:bg-[rgba(184,71,45,0.08)]"
        style={{
          gridTemplateColumns: "28px 1fr auto 24px",
        }}
      >
        <span
          className="self-center font-sans text-[10px] tracking-[0.1em]"
          style={{ color: "var(--ink-ghost, #C9C0B0)" }}
        >
          {ROMAN.day}
        </span>
        <h2
          className="row-day-title font-serif text-[28px] font-light italic leading-[1.1] tracking-tight transition-colors"
          style={{ color: "var(--ink, #1A1614)" }}
        >
          {TITLE.day}
        </h2>
        <span
          className="row-day-meta whitespace-nowrap self-center px-4 font-sans text-[10px] uppercase tracking-[0.12em]"
          style={{ color: "var(--terracotta, #B8472D)", opacity: 0.7 }}
        >
          {metaFor("day")}
        </span>
        <span
          aria-hidden="true"
          className="row-day-arrow self-center text-center font-serif text-[18px] leading-none transition-transform duration-150 group-hover:translate-x-[4px]"
          style={{ color: "var(--terracotta, #B8472D)" }}
        >
          →
        </span>
      </button>
    </div>
  );
}

// -- Strategy row (persistent + time-bound) -----------------------------

function StrategyRow({ horizon }: { horizon: Exclude<Horizon | "day", "day"> }) {
  const row = useStrategyStore((s) => s.rows[horizon]);
  const expandRow = useStrategyStore((s) => s.expandRow);
  const collapseRow = useStrategyStore((s) => s.collapseRow);
  const setContent = useStrategyStore((s) => s.setContent);
  const clearCarryOver = useStrategyStore((s) => s.clearCarryOver);

  // Wire autosave for this row. The hook subscribes to dirty/content and
  // schedules saves; the indicator below reads saveStatus.
  const { flushNow } = useAutosave(horizon);

  // Flush any pending save when the component unmounts (route change /
  // accordion teardown), guaranteeing no in-flight buffer is lost.
  useEffect(() => {
    return () => {
      if (row.dirty) {
        flushNow().catch(() => {});
      }
    };
    // Read row.dirty/flushNow at unmount time. We deliberately don't
    // re-subscribe — only the unmount cleanup matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onToggle = () => {
    if (row.expanded) {
      collapseRow(horizon);
    } else {
      expandRow(horizon).catch(() => {});
    }
  };

  return (
    <div className="border-b" style={{ borderColor: "var(--hairline, #E5DFD3)" }}>
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full cursor-pointer items-baseline px-0 py-[22px] text-left transition-colors hover:bg-[rgba(184,71,45,0.08)]"
        style={{
          gridTemplateColumns: "28px 1fr auto 24px",
        }}
      >
        <span
          className="self-center font-sans text-[10px] tracking-[0.1em]"
          style={{ color: "var(--ink-ghost, #C9C0B0)" }}
        >
          {ROMAN[horizon]}
        </span>
        <h2
          className="font-serif text-[28px] font-light italic leading-[1.1] tracking-tight"
          style={{ color: "var(--ink, #1A1614)" }}
        >
          {TITLE[horizon]}
        </h2>
        <span
          className="whitespace-nowrap self-center px-4 font-sans text-[10px] uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-faint, #A39A8A)" }}
        >
          {metaFor(horizon)}
        </span>
        <span
          aria-hidden="true"
          className="self-center text-center font-serif text-[22px] leading-none transition-transform duration-[250ms]"
          style={{
            color: "var(--ink-ghost, #C9C0B0)",
            transform: row.expanded ? "rotate(45deg)" : "none",
          }}
        >
          +
        </span>
      </button>

      {row.expanded && (
        <div className="pb-9 pl-7 pt-1">
          {row.carryOver && (
            <CarryOverBanner
              horizon={horizon}
              sourcePeriod={row.carryOver.sourcePeriod}
              onClear={() => clearCarryOver(horizon)}
            />
          )}
          <div className="relative max-w-[62ch]">
            <MarkdownEditor
              value={row.content}
              onChange={(v) => setContent(horizon, v)}
              placeholder={PLACEHOLDER[horizon]}
            />
            <span className="absolute -right-2 bottom-0">
              <SaveIndicator status={row.saveStatus} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
