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

import { useNavigate } from "@tanstack/react-router";
import { CarryOverBanner } from "./CarryOverBanner";
import { HorizonInvitation } from "./HorizonInvitation";
import { SectionPreview } from "./SectionPreview";
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
  const navigate = useNavigate();
  const row = useStrategyStore((s) => s.rows[horizon]);
  const expandRow = useStrategyStore((s) => s.expandRow);
  const collapseRow = useStrategyStore((s) => s.collapseRow);
  const clearCarryOver = useStrategyStore((s) => s.clearCarryOver);

  const onToggle = () => {
    if (row.expanded) {
      collapseRow(horizon);
    } else {
      expandRow(horizon).catch(() => {});
    }
  };

  const openEditor = () => {
    navigate({ to: "/horizon/$id", params: { id: horizon } });
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
          ) : row.loaded && row.content === "" ? (
            <>
              <HorizonInvitation horizon={horizon} />
              <button
                type="button"
                onClick={openEditor}
                className="cursor-pointer border-0 bg-transparent p-0 py-1 font-sans text-[11px] font-semibold uppercase transition-colors"
                style={{
                  color: "var(--accent-1)",
                  letterSpacing: "0.22em",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                Begin
                <span
                  aria-hidden="true"
                  className="italic"
                  style={{
                    fontFamily: "var(--font-serif-display)",
                    fontSize: "16px",
                    transform: "translateY(-1px)",
                  }}
                >
                  →
                </span>
              </button>
            </>
          ) : (
            <SectionPreview
              horizon={horizon}
              content={row.content}
              onOpen={openEditor}
              onEdit={openEditor}
            />
          )}
        </div>
      )}
    </div>
  );
}
