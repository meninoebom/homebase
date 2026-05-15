// Masthead — the top of the strategic accordion.
//
// Redesigned to the "Inter Tight, pushed" direction (#09 from the
// May 2026 design canvas): a split layout — confident sans-serif
// wordmark on the left with a marigold tagline tucked under it; the
// dateline stacked on the right; a 2px marigold rule below replacing
// the prior 48px ink-4 hairline.
//
//   left          | right
//   ─────────────────────────────────
//   Homebase      | Friday, May 15, 2026
//   (124px wordmrk)| Volume one · No. 121 · Week 20
//   Your Strategic Life Guide  (marigold tagline)
//
// The "About / Customize" links sit beneath the rule rather than
// stacked in the cover register — they were visually crowding the
// modern split layout.

import { useNavigate } from "@tanstack/react-router";
import { PeriodKey } from "../lib/period-key";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function Masthead() {
  const navigate = useNavigate();
  const now = new Date();
  const weekday = DAYS[now.getDay()];
  const date = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  const weekKey = PeriodKey.current("week", now);
  const weekNum = weekKey ? Number(weekKey.split("-W")[1]) : null;
  const subline = weekNum ? `Volume one · No. ${weekNum} · Week ${weekNum}` : "Volume one";

  return (
    <header className="masthead">
      <div
        className="flex items-end justify-between gap-9 pb-6"
        style={{ borderBottom: "2px solid var(--accent-2)" }}
      >
        <div className="flex min-w-0 shrink flex-col">
          <h1
            style={{
              fontFamily: "var(--font-serif-display)",
              fontStyle: "normal",
              fontWeight: 600,
              fontSize: "clamp(56px, 11vw, 124px)",
              lineHeight: 0.85,
              letterSpacing: "-0.045em",
              color: "var(--ink-1)",
              margin: 0,
            }}
          >
            Homebase
          </h1>
          <div
            className="mt-2.5"
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "17px",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "var(--accent-2)",
            }}
          >
            Your Strategic Life Guide
          </div>
        </div>
        <div
          className="flex shrink-0 flex-col items-end pb-3 text-right"
          style={{ whiteSpace: "nowrap" }}
        >
          <div
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--ink-1)",
            }}
          >
            {weekday}, {date}
          </div>
          <div
            className="mt-1"
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--ink-3)",
            }}
          >
            {subline}
          </div>
        </div>
      </div>
      <div className="mt-4 mb-8 flex items-center justify-end gap-6">
        <button
          type="button"
          onClick={() => navigate({ to: "/about" })}
          className="inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 transition-colors hover:text-[var(--ink-1)]"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--ink-3)",
          }}
        >
          About this guide
          <span aria-hidden="true">→</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/settings" })}
          className="inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 transition-colors hover:text-[var(--ink-1)]"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--ink-3)",
          }}
        >
          Customize
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </header>
  );
}
