// CarryOverResolver — when a user expands a time-bound horizon for a period
// that has no file yet (May 2026 monthly when only April 2026 exists),
// this resolver returns the content to pre-load into the editor along
// with the actual source period, so the carry-over banner can show
// "Carried from April 2026" (or "Carried from March 2026" if April was
// skipped).
//
// Two-step lookup, per the strategic-layer plan §F3 / §4.6:
//
//   1. Direct: read the file for prior period (computed via PeriodKey.prior)
//   2. Fallback: list all files for the horizon, take the lexicographically
//      greatest filename strictly less than the target — handles gaps
//      (April skipped → May resolves March)
//
// Persistent horizons (life-values, life-goals) have no carry-over by design
// (single file, no prior period); calling resolve() with them throws.

import { PeriodKey, type Horizon } from "./period-key";
import type { StrategyFsApi } from "./strategy-fs";

export type CarryOver = { content: string; sourcePeriod: string };

const TIME_BOUND_HORIZONS: ReadonlySet<Horizon> = new Set(["year", "month", "week"]);

/**
 * Filename for a time-bound horizon at a given period key, e.g.
 * `year-2026.md`, `month-2026-04.md`, `week-2026-W17.md`.
 */
function filename(horizon: Horizon, periodKey: string): string {
  return `${horizon}-${periodKey}.md`;
}

/**
 * Filename prefix for a time-bound horizon (used by list()), e.g.
 * `month-` matches `month-2026-04.md`, `month-2026-03.md`, etc.
 */
function prefix(horizon: Horizon): string {
  return `${horizon}-`;
}

/**
 * Extract the period key from a filename produced by `filename()` above.
 * `month-2026-04.md` → `2026-04`.
 */
function periodKeyOf(horizon: Horizon, file: string): string {
  return file.slice(prefix(horizon).length, -".md".length);
}

export const CarryOverResolver = {
  /**
   * Resolve carry-over for `targetPeriod` of `horizon`.
   *
   * Returns the prior period's content (and the actual sourcePeriod)
   * when a prior file exists, falling back to the most recent existing
   * file before targetPeriod when there's a gap. Returns null when no
   * prior file exists at all (very first entry ever for this horizon).
   *
   * The caller is responsible for not calling this when the target file
   * already exists — this function does not check that. Carry-over is
   * a *first-time-entering-a-new-period* concern.
   */
  async resolve(
    fs: StrategyFsApi,
    horizon: Horizon,
    targetPeriod: string,
  ): Promise<CarryOver | null> {
    if (!TIME_BOUND_HORIZONS.has(horizon)) {
      throw new Error(`CarryOverResolver.resolve is undefined for persistent horizon: ${horizon}`);
    }

    // Step 1: try the direct prior period.
    const priorKey = PeriodKey.prior(horizon, targetPeriod);
    const priorContent = await fs.read(filename(horizon, priorKey));
    if (priorContent !== null) {
      return { content: priorContent, sourcePeriod: priorKey };
    }

    // Step 2: fall back to lex-greatest existing file strictly less than target.
    // StrategyFs.list returns descending, so the first entry whose period_key
    // is < targetPeriod is the most recent prior.
    const all = await fs.list(prefix(horizon));
    const targetFile = filename(horizon, targetPeriod);
    for (const file of all) {
      if (file < targetFile) {
        const sourceKey = periodKeyOf(horizon, file);
        const content = await fs.read(file);
        if (content !== null) {
          return { content, sourcePeriod: sourceKey };
        }
      }
    }

    return null;
  },
};
