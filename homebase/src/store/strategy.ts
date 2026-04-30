// Zustand store for the strategic accordion.
//
// State shape per row: { expanded, content, carryOver, saveStatus, dirty, loaded }.
// Six horizons are seeded at idle defaults on initialization; the row's
// content + carryOver are populated lazily on first expand via expandRow.
//
// The store is built via a factory so tests can pass an in-memory fake
// StrategyFs. Production callers use `useStrategyStore`, the singleton
// built from the production StrategyFs.

import { create, type StoreApi, type UseBoundStore } from "zustand";
import { CarryOverResolver, type CarryOver } from "../lib/carry-over-resolver";
import { PeriodKey, type Horizon } from "../lib/period-key";
import { StrategyFs, type StrategyFsApi } from "../lib/strategy-fs";

export type SaveStatus = "idle" | "saving" | "saved";

export interface RowState {
  expanded: boolean;
  content: string;
  carryOver: CarryOver | null;
  saveStatus: SaveStatus;
  dirty: boolean;
  loaded: boolean;
}

export interface StrategyState {
  rows: Record<Horizon, RowState>;
  expandRow: (horizon: Horizon) => Promise<void>;
  collapseRow: (horizon: Horizon) => void;
  setContent: (horizon: Horizon, content: string) => void;
  clearCarryOver: (horizon: Horizon) => void;
  flush: (horizon: Horizon) => Promise<void>;
  resetSaveStatus: (horizon: Horizon) => void;
}

const HORIZONS: readonly Horizon[] = ["life-values", "life-goals", "year", "month", "week"];

function defaultRow(): RowState {
  return {
    expanded: false,
    content: "",
    carryOver: null,
    saveStatus: "idle",
    dirty: false,
    loaded: false,
  };
}

function defaultRows(): Record<Horizon, RowState> {
  const rows = {} as Record<Horizon, RowState>;
  for (const h of HORIZONS) rows[h] = defaultRow();
  return rows;
}

/**
 * Filename for a horizon. Persistent horizons use a fixed filename;
 * time-bound horizons compute the current period via PeriodKey at call
 * time (so a row expanded after midnight on Monday targets the new week).
 */
function filenameFor(horizon: Horizon, now: Date = new Date()): string {
  if (horizon === "life-values") return "values.md";
  if (horizon === "life-goals") return "life-goals.md";
  const key = PeriodKey.current(horizon, now);
  if (!key) {
    // PeriodKey.current returns null only for persistent horizons, both
    // handled above. This branch is unreachable at runtime.
    throw new Error(`unexpected null period_key for time-bound horizon: ${horizon}`);
  }
  return `${horizon}-${key}.md`;
}

/**
 * Build a Strategy store backed by `fs`. Production uses the real
 * StrategyFs singleton; tests pass createFakeStrategyFs(...).
 */
export function createStrategyStore(fs: StrategyFsApi): UseBoundStore<StoreApi<StrategyState>> {
  return create<StrategyState>()((set, get) => ({
    rows: defaultRows(),

    expandRow: async (horizon) => {
      const row = get().rows[horizon];

      // Already loaded? Just open it; no re-fetch.
      if (row.loaded) {
        set((s) => ({
          rows: { ...s.rows, [horizon]: { ...s.rows[horizon], expanded: true } },
        }));
        return;
      }

      // First-time expand: read the file. If it exists, that's the content.
      // If it doesn't exist and the horizon is time-bound, run the resolver
      // to find a carry-over candidate.
      const file = filenameFor(horizon);
      const existing = await fs.read(file);

      let content = "";
      let carryOver: CarryOver | null = null;
      if (existing !== null) {
        content = existing;
      } else if (horizon === "year" || horizon === "month" || horizon === "week") {
        const targetPeriod = PeriodKey.current(horizon);
        if (targetPeriod) {
          const co = await CarryOverResolver.resolve(fs, horizon, targetPeriod);
          if (co) {
            content = co.content;
            carryOver = co;
          }
        }
      }

      set((s) => ({
        rows: {
          ...s.rows,
          [horizon]: {
            ...s.rows[horizon],
            expanded: true,
            content,
            carryOver,
            loaded: true,
            // Carrying content into a never-saved buffer counts as dirty:
            // user has unsaved content (the prior period's body) sitting in
            // a file that doesn't exist yet. First flush writes it and the
            // banner dismisses naturally on first edit.
            dirty: carryOver !== null,
          },
        },
      }));
    },

    collapseRow: (horizon) => {
      set((s) => ({
        rows: { ...s.rows, [horizon]: { ...s.rows[horizon], expanded: false } },
      }));
    },

    setContent: (horizon, content) => {
      set((s) => ({
        rows: {
          ...s.rows,
          [horizon]: {
            ...s.rows[horizon],
            content,
            dirty: true,
            // First edit dismisses the carry-over banner — the user has
            // engaged with the content, the "this is carried" affordance is
            // no longer needed.
            carryOver: null,
          },
        },
      }));
    },

    clearCarryOver: (horizon) => {
      // Empty the buffer and reset the banner. `loaded: false` so the next
      // expand re-runs the resolver — that's the documented "re-trigger by
      // collapsing and re-expanding" behavior from plan §F3.
      set((s) => ({
        rows: {
          ...s.rows,
          [horizon]: {
            ...s.rows[horizon],
            content: "",
            carryOver: null,
            dirty: false,
            loaded: false,
          },
        },
      }));
    },

    flush: async (horizon) => {
      const row = get().rows[horizon];
      if (!row.dirty) return;
      set((s) => ({
        rows: { ...s.rows, [horizon]: { ...s.rows[horizon], saveStatus: "saving" } },
      }));
      try {
        await fs.write(filenameFor(horizon), row.content);
        set((s) => ({
          rows: {
            ...s.rows,
            [horizon]: { ...s.rows[horizon], saveStatus: "saved", dirty: false },
          },
        }));
      } catch (err) {
        set((s) => ({
          rows: { ...s.rows, [horizon]: { ...s.rows[horizon], saveStatus: "idle" } },
        }));
        throw err;
      }
    },

    resetSaveStatus: (horizon) => {
      set((s) => ({
        rows: { ...s.rows, [horizon]: { ...s.rows[horizon], saveStatus: "idle" } },
      }));
    },
  }));
}

/** Production singleton, bound to the real StrategyFs. */
export const useStrategyStore = createStrategyStore(StrategyFs);
