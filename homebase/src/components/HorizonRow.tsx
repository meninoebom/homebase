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
import { HorizonInvitation } from "./HorizonInvitation";
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
    <div
      className="row-day"
      style={{
        borderTop: "1px solid var(--paper-edge)",
        borderBottom: "1px solid var(--paper-edge)",
      }}
    >
      <button
        type="button"
        onClick={onDayClick}
        className="day-row-button group grid w-full cursor-pointer items-baseline px-1 text-left transition-colors hover:bg-[var(--paper-2)]"
        style={{
          gridTemplateColumns: "36px 1fr auto 30px",
          gap: "14px",
          paddingTop: "var(--row-pad-y)",
          paddingBottom: "var(--row-pad-y)",
        }}
      >
        <span
          className="italic"
          style={{
            fontFamily: "var(--font-numeral)",
            fontSize: "16px",
            color: "var(--ink-4)",
            letterSpacing: "0.02em",
          }}
        >
          {ROMAN.day}
        </span>
        <h2
          className="row-day-title italic transition-colors"
          style={{
            fontFamily: "var(--font-serif-display)",
            fontWeight: 400,
            fontSize: "calc(36px * var(--display-scale, 1))",
            lineHeight: 1,
            letterSpacing: "-0.01em",
            color: "var(--ink-1)",
          }}
        >
          {TITLE.day}
        </h2>
        <span
          className="whitespace-nowrap self-center font-sans text-[11px] font-medium uppercase"
          style={{
            color: "var(--accent-1)",
            letterSpacing: "0.2em",
          }}
        >
          {metaFor("day")}
        </span>
        <span
          aria-hidden="true"
          className="row-day-arrow text-right transition-transform duration-200 group-hover:translate-x-[4px]"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "22px",
            fontWeight: 300,
            lineHeight: 1,
            color: "var(--accent-1)",
          }}
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
    <div
      className={row.expanded ? "toc-row-open" : undefined}
      style={{
        borderTop: "1px solid var(--paper-edge)",
        background: row.expanded ? "var(--paper-2)" : "transparent",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full cursor-pointer items-baseline px-1 text-left transition-colors hover:bg-[var(--paper-2)]"
        style={{
          gridTemplateColumns: "36px 1fr auto 30px",
          gap: "14px",
          paddingTop: "var(--row-pad-y)",
          paddingBottom: "var(--row-pad-y)",
        }}
      >
        <span
          className="italic"
          style={{
            fontFamily: "var(--font-numeral)",
            fontSize: "16px",
            color: "var(--ink-4)",
            letterSpacing: "0.02em",
          }}
        >
          {ROMAN[horizon]}
        </span>
        <h2
          className="italic"
          style={{
            fontFamily: "var(--font-serif-display)",
            fontWeight: 400,
            fontSize: "calc(36px * var(--display-scale, 1))",
            lineHeight: 1,
            letterSpacing: "-0.01em",
            color: "var(--ink-1)",
          }}
        >
          {TITLE[horizon]}
        </h2>
        <span
          className="whitespace-nowrap font-sans text-[11px] font-medium uppercase"
          style={{
            color: "var(--ink-3)",
            letterSpacing: "0.2em",
          }}
        >
          {metaFor(horizon)}
        </span>
        <span
          aria-hidden="true"
          className="text-right transition-transform duration-200"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "22px",
            fontWeight: 300,
            lineHeight: 1,
            color: row.expanded ? "var(--ink-1)" : "var(--ink-3)",
            transform: row.expanded ? "rotate(45deg)" : "none",
          }}
        >
          +
        </span>
      </button>

      {row.expanded && (
        <div
          className="pl-14 pr-2 pb-8 pt-1"
          style={{ borderBottom: "1px solid var(--paper-edge)" }}
        >
          {row.carryOver ? (
            <CarryOverBanner
              horizon={horizon}
              sourcePeriod={row.carryOver.sourcePeriod}
              onClear={() => clearCarryOver(horizon)}
            />
          ) : (
            row.content === "" && <HorizonInvitation horizon={horizon} />
          )}
          <div className="relative max-w-[62ch]">
            <MarkdownEditor
              value={row.content}
              onChange={(v) => setContent(horizon, v)}
              placeholder={PLACEHOLDER[horizon]}
              onSave={flushNow}
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
