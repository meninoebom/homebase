// Zustand store for the morning ritual sequence.
//
// Two logical slices in one store:
//
// - `sequence` — which slots are in today's sequence, which one is current,
//   what mode we're in, when we started. Persisted to localStorage so a
//   mid-morning crash resumes cleanly.
// - `drafts` — ephemeral per-slot draft text. ALSO persisted, so textarea
//   contents survive a crash. When a slot completes via appendSection, its
//   draft is cleared.
//
// This is the one mutable state layer in the frontend. Slot components
// subscribe via selectors rather than reading the whole state object.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { appendSection, todayISO } from "../lib/log";

export type SlotId = string;
export type RitualMode = "morning" | "adhoc";

interface RitualState {
  // sequence
  slotOrder: SlotId[];
  currentIndex: number;
  mode: RitualMode;
  startedAt: number | null;
  completedAt: number | null;

  // drafts (ephemeral per slot, but persisted across app restarts for crash
  // recovery — Brandon doesn't lose a dream if the window is forced shut)
  drafts: Record<SlotId, string>;

  // actions
  startMorning: (slotOrder: SlotId[]) => void;
  completeSlot: (slotId: SlotId, body: string) => Promise<void>;
  setDraft: (slotId: SlotId, body: string) => void;
  enterAdhoc: (slotId: SlotId) => void;
  reset: () => void;
}

const EMPTY_STATE = {
  slotOrder: [] as SlotId[],
  currentIndex: 0,
  mode: "morning" as RitualMode,
  startedAt: null as number | null,
  completedAt: null as number | null,
  drafts: {} as Record<SlotId, string>,
};

/**
 * True if two timestamps fall on the same local calendar day. Used by
 * startMorning to detect stale sessions from previous days. Uses
 * Date.toDateString() which formats as "Fri Apr 10 2026" — a date-only
 * representation that ignores time of day and timezone math.
 */
function isSameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export const useRitualStore = create<RitualState>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      startMorning: (slotOrder) => {
        // Four cases this handles:
        //
        //   1. First ever: startedAt === null → fresh start.
        //   2. In progress today (started, not yet completed, same day):
        //      leave the state alone so reloads / hot-reloads don't wipe
        //      mid-slot drafts.
        //   3. Completed today (started AND completed earlier today):
        //      leave the state alone. The morning runner's isDone check
        //      renders EndOfMorning, giving Brandon a gentle "you're done
        //      for today" acknowledgment instead of starting a new morning.
        //   4. Stale from a previous day (startedAt from yesterday or
        //      earlier, whether or not completedAt is set): reset and
        //      start fresh. Uncommitted drafts from the stale session are
        //      discarded — they never made it into the canonical log, so
        //      we treat them as never-happened. (Committed writing is in
        //      the day log file, unaffected by this reset.)
        //
        // See docs/save-architecture.md §"Stale session detection" for
        // the reasoning behind treating yesterday's incomplete drafts as
        // ephemeral.
        const state = get();
        if (state.startedAt !== null && isSameDay(state.startedAt, Date.now())) {
          // Case 2 or 3: same-day session, leave it alone.
          return;
        }
        // Case 1 or 4: fresh start.
        set({
          slotOrder,
          currentIndex: 0,
          mode: "morning",
          startedAt: Date.now(),
          completedAt: null,
          drafts: {},
        });
      },

      completeSlot: async (slotId, body) => {
        // Write to the canonical log first. If the Rust command fails, we
        // leave state alone and surface the error — the draft stays for
        // retry. This is the one place where an await can interrupt the
        // UI transition; the morning route handles the error state.
        await appendSection(todayISO(), slotId, body);

        set((state) => {
          const nextDrafts = { ...state.drafts };
          delete nextDrafts[slotId];
          const newIndex = state.currentIndex + 1;
          const isDone = newIndex >= state.slotOrder.length;
          return {
            drafts: nextDrafts,
            currentIndex: newIndex,
            completedAt: isDone ? Date.now() : state.completedAt,
          };
        });
      },

      setDraft: (slotId, body) => {
        set((state) => ({
          drafts: { ...state.drafts, [slotId]: body },
        }));
      },

      enterAdhoc: (slotId) => {
        set({
          slotOrder: [slotId],
          currentIndex: 0,
          mode: "adhoc",
          startedAt: Date.now(),
          completedAt: null,
          drafts: {},
        });
      },

      reset: () => {
        set(EMPTY_STATE);
      },
    }),
    {
      name: "morning-ritual-state",
      storage: createJSONStorage(() => localStorage),
      // Persist the entire state (sequence + drafts). Drafts outliving a
      // crash is a feature, not a bug — Brandon doesn't lose mid-slot writing.
      //
      // Version history:
      //   1 → 2 (2026-04-10): palette change wiped stale test drafts
      //   2 → 3 (2026-04-10): slotOrder changed from ["dreams"] to
      //     ["dreams", "inner-weather"] but persisted sessions kept the
      //     old single-slot array, so Brandon was seeing "1 of 1" on
      //     launches that should have been "1 of 2." Bumping invalidates
      //     any session that was started before inner-weather landed.
      //
      // Rule: bump this version any time the STATE SHAPE or the slotOrder
      // contents change in a way that makes persisted sessions stale.
      // Drafts in the canonical day log are never affected — only the
      // in-progress session state, which is by design ephemeral-ish.
      version: 3,
    },
  ),
);

// -- Selectors ------------------------------------------------------------
// Use these in components, not raw state reads. They're stable references
// that Zustand can compare for re-render avoidance.

export const selectCurrentSlotId = (s: RitualState): SlotId | null =>
  s.slotOrder[s.currentIndex] ?? null;

export const selectIsDone = (s: RitualState): boolean => s.completedAt !== null;

export const selectIsLastSlot = (s: RitualState): boolean =>
  s.currentIndex >= s.slotOrder.length - 1;

export const selectSlotsRemaining = (s: RitualState): number =>
  Math.max(0, s.slotOrder.length - s.currentIndex);

export const selectElapsedMs = (s: RitualState): number => {
  if (s.startedAt === null) return 0;
  const end = s.completedAt ?? Date.now();
  return end - s.startedAt;
};
