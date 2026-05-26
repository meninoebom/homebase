// Zustand store for the strategic accordion.
//
// State shape per row: { expanded, content, carryOver, saveStatus, dirty, loaded, loadError }.
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

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface RowState {
  expanded: boolean;
  content: string;
  carryOver: CarryOver | null;
  saveStatus: SaveStatus;
  dirty: boolean;
  loaded: boolean;
  // True when the last load attempt threw a real error (not a missing file).
  // The fs layer maps a missing file to null/""; anything else (revoked
  // permission, I/O failure) re-throws and lands here. The UI must show an
  // error instead of the empty-horizon invitation, or the user could type
  // over content that's merely unreadable and overwrite it (#80).
  loadError: boolean;
}

export interface StrategyState {
  rows: Record<Horizon, RowState>;
  expandRow: (horizon: Horizon) => Promise<void>;
  prefetchRow: (horizon: Horizon) => Promise<void>;
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
    loadError: false,
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
      try {
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
              loadError: false,
              // Carrying content into a never-saved buffer counts as dirty:
              // user has unsaved content (the prior period's body) sitting in
              // a file that doesn't exist yet. First flush writes it and the
              // banner dismisses naturally on first edit.
              dirty: carryOver !== null,
            },
          },
        }));
      } catch (err) {
        // A real read failure (not a missing file — the fs layer maps that to
        // null). Expand so the error shows in place, but leave loaded=false so
        // the UI renders an error instead of an empty horizon, and a retry
        // re-reads rather than short-circuiting. See #80.
        console.error(`strategy: failed to load ${horizon}`, err);
        set((s) => ({
          rows: {
            ...s.rows,
            // carryOver:null keeps the error state self-consistent — a load
            // failure must not leave a stale "Carried" banner rendering next
            // to the error notice.
            [horizon]: {
              ...s.rows[horizon],
              expanded: true,
              loaded: false,
              loadError: true,
              carryOver: null,
            },
          },
        }));
      }
    },

    // Read the row's state *without* expanding it, so collapsed rows can
    // surface a faint preview line and the header's "Carried · …" label.
    // Mirrors expandRow's load path: own file first, then carry-over resolver
    // for time-bound horizons. Safe to run eagerly on accordion mount — the
    // autosave hook only mounts on the editor route, so prefetched carry-over
    // never auto-writes from the homepage alone; materialization still
    // requires the user navigating into /horizon/:id and either editing or
    // blurring the editor.
    prefetchRow: async (horizon) => {
      if (get().rows[horizon].loaded) return;
      try {
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
        if (content === "" && carryOver === null) return;

        set((s) => ({
          rows: {
            ...s.rows,
            [horizon]: {
              ...s.rows[horizon],
              content,
              carryOver,
              loaded: true,
              loadError: false,
              // Match expandRow: a carried buffer is a pending write that
              // commits when the user lands on the editor (autosave fires
              // on blur / debounce there).
              dirty: carryOver !== null,
            },
          },
        }));
      } catch (err) {
        // Same #80 hazard as expandRow: a real read failure must not pass for
        // an empty row. Flag it (without expanding — this is the collapsed
        // prefetch) so a later expand surfaces the error instead of an
        // overwriteable blank.
        console.error(`strategy: failed to prefetch ${horizon}`, err);
        set((s) => ({
          rows: { ...s.rows, [horizon]: { ...s.rows[horizon], loadError: true, carryOver: null } },
        }));
      }
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
            loadError: false,
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
        // Surface the failure via saveStatus="error" — the SaveIndicator
        // will render an error pip until the next successful save (or until
        // the user retries by editing again, which moves us to "saving").
        // dirty stays true so the next edit/blur retries. Log too, so a save
        // failure leaves a console trace (callers swallow the rethrow).
        console.error(`strategy: failed to save ${horizon}`, err);
        set((s) => ({
          rows: { ...s.rows, [horizon]: { ...s.rows[horizon], saveStatus: "error" } },
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
