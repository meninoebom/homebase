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

export const useRitualStore = create<RitualState>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      startMorning: (slotOrder) => {
        // Idempotent: if a morning is already in progress (startedAt set but
        // not yet completedAt), leave state alone. This means reloading the
        // dev window mid-sequence won't wipe progress.
        const state = get();
        if (state.startedAt !== null && state.completedAt === null) {
          return;
        }
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
      version: 1,
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
