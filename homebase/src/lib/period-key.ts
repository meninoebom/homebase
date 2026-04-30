// PeriodKey — date/period semantics for the strategic layer's time-bound horizons.
//
// Every time-bound horizon (year/month/week) has a string key that round-trips
// through the filesystem (`year-2026.md`, `month-2026-04.md`, `week-2026-W17.md`).
// This module is the single source of truth for parsing, formatting, and
// rolling those keys back one period — particularly across ISO week
// boundaries where year != ISO year and a year may have 53 weeks.
//
// Persistent horizons (life-values, life-goals) have no period, so current()
// returns null and prior()/format() throw if called with them.

import {
  format as fmt,
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  setISOWeekYear,
  startOfISOWeek,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";

export type Horizon = "life-values" | "life-goals" | "year" | "month" | "week";

const TIME_BOUND: ReadonlySet<Horizon> = new Set(["year", "month", "week"]);

function isTimeBound(horizon: Horizon): boolean {
  return TIME_BOUND.has(horizon);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Parse a time-bound period key into an anchor Date inside that period.
 *
 * The anchor is the first day of the period — Jan 1 for year, the 1st for
 * month, the Monday of ISO week for week — at noon UTC. The noon offset
 * dodges DST edge cases when the host runs in a TZ where midnight crosses
 * a transition.
 */
function anchorOf(horizon: Horizon, key: string): Date {
  switch (horizon) {
    case "year": {
      const y = Number(key);
      if (!Number.isInteger(y)) throw new Error(`invalid year key: ${key}`);
      return new Date(Date.UTC(y, 0, 1, 12, 0, 0));
    }
    case "month": {
      const m = /^(\d{4})-(\d{2})$/.exec(key);
      if (!m) throw new Error(`invalid month key: ${key}`);
      return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1, 12, 0, 0));
    }
    case "week": {
      const w = /^(\d{4})-W(\d{2})$/.exec(key);
      if (!w) throw new Error(`invalid week key: ${key}`);
      const isoYear = Number(w[1]);
      const isoWeek = Number(w[2]);
      // Build the Monday of that ISO week. Start from Jan 4 (always in W1)
      // of the ISO year, set ISO year (idempotent here but explicit), then
      // set ISO week, then snap to startOfISOWeek (Monday).
      let d = new Date(Date.UTC(isoYear, 0, 4, 12, 0, 0));
      d = setISOWeekYear(d, isoYear);
      d = setISOWeek(d, isoWeek);
      d = startOfISOWeek(d);
      return d;
    }
    default:
      throw new Error(`anchorOf called with persistent horizon: ${horizon}`);
  }
}

function keyOf(horizon: Horizon, d: Date): string {
  switch (horizon) {
    case "year":
      return String(d.getUTCFullYear());
    case "month":
      return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
    case "week":
      return `${getISOWeekYear(d)}-W${pad2(getISOWeek(d))}`;
    default:
      throw new Error(`keyOf called with persistent horizon: ${horizon}`);
  }
}

export const PeriodKey = {
  /**
   * The key for the current period of `horizon`, or null for persistent
   * horizons (life-values, life-goals).
   *
   * `now` is exposed as an optional override for tests; production calls
   * pass nothing and get the wall clock.
   */
  current(horizon: Horizon, now: Date = new Date()): string | null {
    if (!isTimeBound(horizon)) return null;
    return keyOf(horizon, now);
  },

  /**
   * The key one period prior to `key`. Throws for persistent horizons.
   *
   * Year and month are direct subtraction. Week subtracts seven days from
   * the Monday anchor and re-derives the ISO year/week — which correctly
   * yields W52 (52-week years), W53 (53-week years), and the correct ISO
   * year at January boundaries.
   */
  prior(horizon: Horizon, key: string): string {
    if (!isTimeBound(horizon)) {
      throw new Error(`PeriodKey.prior is undefined for persistent horizon: ${horizon}`);
    }
    const anchor = anchorOf(horizon, key);
    let prev: Date;
    if (horizon === "year") prev = subYears(anchor, 1);
    else if (horizon === "month") prev = subMonths(anchor, 1);
    else prev = subWeeks(anchor, 1);
    return keyOf(horizon, prev);
  },

  /**
   * A human-readable label for the period — what shows up in the carry-over
   * banner (e.g. "April 2026", "Week 17, 2026"). Throws for persistent
   * horizons.
   */
  format(horizon: Horizon, key: string): string {
    if (!isTimeBound(horizon)) {
      throw new Error(`PeriodKey.format is undefined for persistent horizon: ${horizon}`);
    }
    const anchor = anchorOf(horizon, key);
    switch (horizon) {
      case "year":
        return key;
      case "month":
        // "April 2026" — date-fns LLLL = stand-alone month name, yyyy = year.
        return fmt(anchor, "LLLL yyyy");
      case "week": {
        const m = /^(\d{4})-W(\d{2})$/.exec(key);
        // Existing key shape was validated by anchorOf above; this regex
        // is for extracting the displayed values without leading zeros.
        if (!m) throw new Error(`invalid week key: ${key}`);
        return `Week ${Number(m[2])}, ${m[1]}`;
      }
      default:
        // Unreachable — isTimeBound() narrowed `horizon` above. Throw
        // satisfies the type checker without lying about behavior.
        throw new Error(`unreachable: format(${horizon as string})`);
    }
  },
};
