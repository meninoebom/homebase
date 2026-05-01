// Masthead — the top of the strategic accordion.
//
// Three lines of type:
//   eyebrow  — "A STRATEGIC LIFE GUIDE"  (Inter Tight 10px, 0.28em tracking)
//   word     — "Homebase"                 (Newsreader italic 84px)
//   meta     — dateline                   (Inter Tight 11px, 0.22em tracking)
//
// Plus a 48px horizontal rule below in --ink-4 to mark the end of the
// cover register and the start of the table of contents.
//
// Per the redesign prototype at ~/dev/homebase/Homebase Redesign/.

import { PeriodKey } from "../lib/period-key";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

export function Masthead() {
  const now = new Date();
  const weekday = DAYS[now.getDay()];
  const date = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  const weekKey = PeriodKey.current("week", now);
  const week = weekKey ? `WEEK ${Number(weekKey.split("-W")[1])}` : "";

  return (
    <header className="masthead text-center">
      <div
        className="font-sans text-[10px] font-medium uppercase"
        style={{ color: "var(--ink-3)", letterSpacing: "0.28em" }}
      >
        A Strategic Life Guide
      </div>
      <h1
        className="my-3 italic"
        style={{
          fontFamily: "var(--font-serif-display)",
          fontWeight: 400,
          fontSize: "calc(84px * var(--display-scale, 1))",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: "var(--ink-1)",
        }}
      >
        Homebase
      </h1>
      <div
        className="font-sans text-[11px] font-medium uppercase"
        style={{ color: "var(--ink-3)", letterSpacing: "0.22em" }}
      >
        {weekday} <span aria-hidden="true">·</span> {date} <span aria-hidden="true">·</span> {week}
      </div>
      <div
        aria-hidden="true"
        className="mx-auto mt-[22px] mb-9 h-px w-12"
        style={{ background: "var(--ink-4)" }}
      />
    </header>
  );
}
