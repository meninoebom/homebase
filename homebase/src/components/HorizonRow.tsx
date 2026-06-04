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
import { useNavigate } from "@tanstack/react-router";
import { CarryOverBanner } from "./CarryOverBanner";
import { HorizonInvitation } from "./HorizonInvitation";
import { HorizonLoadError } from "./HorizonLoadError";
import { SectionPreview } from "./SectionPreview";
import { extractCollapsedPreview } from "../lib/markdown-preview";
import { PeriodKey, type Horizon } from "../lib/period-key";
import { useStrategyStore } from "../store/strategy";

const TITLE: Record<Horizon | "day", string> = {
  "life-values": "Life values",
  "life-goals": "Life goals",
  year: "This year",
  month: "This month",
  week: "This week",
  day: "Today",
};

// Perspective gradient — the rows are *horizons*. The far ones (life values)
// sit high, small, and pale, like a distant horizon line you steer by; Today
// is the ground under your feet — largest, boldest, rust-solid at the base.
// Size and ink recede as the scale lengthens, so the eye tapers downward and
// lands on the day you can actually act in. Sizes multiply by --display-scale
// so the settings customization still scales the whole stack together.
const DEPTH: Record<Horizon | "day", { size: number; color: string }> = {
  "life-values": { size: 32, color: "var(--ink-3)" },
  "life-goals": { size: 37, color: "var(--ink-3)" },
  year: { size: 43, color: "var(--ink-2)" },
  month: { size: 49, color: "var(--ink-2)" },
  week: { size: 56, color: "var(--ink-1)" },
  day: { size: 64, color: "var(--accent-1)" },
};

/** Metadata text shown in the header's right column. */
function metaFor(horizon: Horizon | "day"): string {
  if (horizon === "day") return "Open today's page";
  if (horizon === "life-values" || horizon === "life-goals") return "Persistent";
  const key = PeriodKey.current(horizon);
  if (!key) return "";
  return PeriodKey.format(horizon, key);
}

/**
 * Short label for the period (no year), used in the "Carried · ___" form.
 * Year keeps its 4-digit form; month becomes "May"; week becomes "Week 20".
 */
function shortMetaFor(horizon: Exclude<Horizon, "life-values" | "life-goals">): string {
  const key = PeriodKey.current(horizon);
  if (!key) return "";
  const full = PeriodKey.format(horizon, key);
  if (horizon === "year") return full;
  if (horizon === "month") return full.split(" ")[0]; // "May 2026" → "May"
  return full.split(",")[0]; // "Week 20, 2026" → "Week 20"
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
        className="day-row-button group grid w-full cursor-pointer items-center px-4 text-left transition-colors hover:bg-[var(--paper-3)]"
        style={{
          gridTemplateColumns: "1fr auto 36px",
          gap: "24px",
          paddingTop: "var(--row-pad-y)",
          paddingBottom: "var(--row-pad-y)",
        }}
      >
        <h2
          className="row-day-title transition-colors"
          style={{
            fontFamily: "var(--font-serif-display)",
            fontWeight: 600,
            fontSize: `calc(${DEPTH.day.size}px * var(--display-scale, 1))`,
            lineHeight: 1,
            letterSpacing: "-0.035em",
            color: DEPTH.day.color,
          }}
        >
          {TITLE.day}
        </h2>
        <span aria-hidden="true" />
        <span
          aria-hidden="true"
          className="row-day-arrow text-right transition-transform duration-200 group-hover:translate-x-[4px]"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "28px",
            fontWeight: 500,
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
  const prefetchRow = useStrategyStore((s) => s.prefetchRow);
  const collapseRow = useStrategyStore((s) => s.collapseRow);
  const clearCarryOver = useStrategyStore((s) => s.clearCarryOver);

  // Pull saved content into state on mount so collapsed rows can show a
  // faint preview line. Skips the carry-over resolver — see prefetchRow.
  // prefetchRow handles read errors internally (sets row.loadError); the
  // catch is a defensive backstop for anything unexpected.
  useEffect(() => {
    prefetchRow(horizon).catch((err) => console.error(err));
  }, [horizon, prefetchRow]);

  const onToggle = () => {
    if (row.expanded) {
      collapseRow(horizon);
    } else {
      expandRow(horizon).catch((err) => console.error(err));
    }
  };

  const collapsedPreview =
    !row.expanded && row.content ? extractCollapsedPreview(row.content) : null;

  const openEditor = () => {
    navigate({ to: "/horizon/$id", params: { id: horizon } });
  };

  return (
    <div
      className={row.expanded ? "toc-row-open" : undefined}
      style={{
        borderTop: "1px solid var(--paper-edge)",
        background: row.expanded ? "var(--paper-3)" : "transparent",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full cursor-pointer items-center px-4 text-left transition-colors hover:bg-[var(--paper-3)]"
        style={{
          gridTemplateColumns: "1fr auto 36px",
          gap: "24px",
          paddingTop: "var(--row-pad-y)",
          paddingBottom: "var(--row-pad-y)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-serif-display)",
            fontWeight: 600,
            fontSize: `calc(${DEPTH[horizon].size}px * var(--display-scale, 1))`,
            lineHeight: 1,
            letterSpacing: "-0.035em",
            color: DEPTH[horizon].color,
          }}
        >
          {TITLE[horizon]}
        </h2>
        <span
          className="whitespace-nowrap"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--accent-2)",
          }}
        >
          {row.carryOver && horizon !== "life-values" && horizon !== "life-goals" ? (
            <>
              <span style={{ color: "var(--accent-1)", fontWeight: 700 }}>Carried</span>
              <span aria-hidden="true"> · </span>
              {shortMetaFor(horizon)}
            </>
          ) : (
            metaFor(horizon)
          )}
        </span>
        <span
          aria-hidden="true"
          className="text-right"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "28px",
            fontWeight: 300,
            lineHeight: 1,
            color: row.expanded ? "var(--ink-1)" : "var(--ink-3)",
          }}
        >
          {row.expanded ? "−" : "+"}
        </span>
        {collapsedPreview && (
          <span
            style={{
              gridColumn: 1,
              gridRow: 2,
              marginTop: "8px",
              minWidth: 0,
              fontFamily: "var(--font-sans-ui)",
              fontSize: "15px",
              fontWeight: 500,
              lineHeight: 1.4,
              color: "var(--ink-3)",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {collapsedPreview}
          </span>
        )}
      </button>

      {row.expanded && (
        <div
          className="pl-[88px] pr-5 pb-8 pt-1"
          style={{ borderBottom: "1px solid var(--paper-edge)" }}
        >
          {row.carryOver && (
            <CarryOverBanner
              horizon={horizon}
              sourcePeriod={row.carryOver.sourcePeriod}
              onClear={() => clearCarryOver(horizon)}
            />
          )}
          {row.loadError ? (
            <HorizonLoadError
              onRetry={() => expandRow(horizon).catch((err) => console.error(err))}
            />
          ) : row.loaded && row.content === "" ? (
            <>
              <HorizonInvitation horizon={horizon} />
              <button
                type="button"
                onClick={openEditor}
                className="group cursor-pointer border-0 bg-transparent p-0 py-1 transition-colors hover:text-[var(--accent-1-hover)]"
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--accent-1)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                Begin
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-[2px]"
                  style={{
                    fontFamily: "var(--font-sans-ui)",
                    fontSize: "18px",
                    fontWeight: 500,
                  }}
                >
                  →
                </span>
              </button>
            </>
          ) : (
            <SectionPreview horizon={horizon} content={row.content} onOpen={openEditor} />
          )}
        </div>
      )}
    </div>
  );
}
