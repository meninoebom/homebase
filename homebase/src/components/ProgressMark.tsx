// ProgressMark — small editorial visualization for time-bound horizons.
//
// Year and month: a hairline bar with an accent fill, with current /
// total numerals in italic Cormorant. "120 ─── of 365"
// Week: seven M-T-W-T-F-S-S dots; past in --ink-3, today in accent,
// future in --ink-4. Mon-start (ISO).
//
// All values computed from `now` (or the wall clock) — no props beyond
// the kind. Keeps the strategic accordion's §15 "no metrics" stance:
// these are *temporal* indicators (where in the period are we?), not
// *progress-toward-goal* trackers.

import type { Horizon } from "../lib/period-key";

interface Props {
  horizon: Horizon;
  now?: Date;
}

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function ProgressMark({ horizon, now = new Date() }: Props) {
  if (horizon === "year") {
    const dayOfYear = computeDayOfYear(now);
    const totalDays = isLeap(now.getFullYear()) ? 366 : 365;
    return <BarMark current={dayOfYear} total={totalDays} unit="days" />;
  }
  if (horizon === "month") {
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return <BarMark current={dayOfMonth} total={daysInMonth} unit="days" />;
  }
  if (horizon === "week") {
    // ISO Monday-start weekday: 0..6 (Mon..Sun)
    const jsDay = now.getDay(); // 0 = Sun, 1 = Mon, ...
    const todayIndex = (jsDay + 6) % 7; // 0 = Mon, ..., 6 = Sun
    return <WeekMark todayIndex={todayIndex} />;
  }
  return null;
}

function BarMark({ current, total, unit }: { current: number; total: number; unit: string }) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="mb-[22px] mt-1 flex items-center gap-[14px]">
      <span
        className="italic whitespace-nowrap"
        style={{
          fontFamily: "var(--font-numeral)",
          fontSize: "16px",
          color: "var(--ink-3)",
        }}
      >
        {current}
      </span>
      <div
        className="relative h-px flex-1"
        style={{ background: "var(--paper-edge)" }}
        aria-label={`${current} of ${total} ${unit}`}
      >
        <span
          className="absolute left-0 -top-px block h-[3px]"
          style={{ background: "var(--accent-1)", width: `${pct}%` }}
        />
      </div>
      <span
        className="italic whitespace-nowrap"
        style={{
          fontFamily: "var(--font-numeral)",
          fontSize: "16px",
          color: "var(--ink-3)",
        }}
      >
        of {total}
      </span>
    </div>
  );
}

function WeekMark({ todayIndex }: { todayIndex: number }) {
  return (
    <div className="mb-[22px] mt-1 flex gap-1.5" aria-label="Week progress">
      {WEEK_LABELS.map((l, i) => {
        const isPast = i < todayIndex;
        const isToday = i === todayIndex;
        const color = isToday ? "var(--accent-1)" : isPast ? "var(--ink-3)" : "var(--ink-4)";
        const borderColor = isToday
          ? "var(--accent-1)"
          : isPast
            ? "var(--ink-4)"
            : "var(--paper-edge)";
        return (
          <div
            key={i}
            className="flex-1 text-center font-sans text-[10px] font-medium uppercase"
            style={{
              borderTop: `2px solid ${borderColor}`,
              color,
              letterSpacing: "0.18em",
              padding: "8px 0 10px",
            }}
          >
            {l}
          </div>
        );
      })}
    </div>
  );
}

function computeDayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000) + 1;
}

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
