// Zustand store for the Homebase hub.
//
// Hub model: all sections are visible at once on a scrollable page. Drafts
// are per-section strings. Saving is explicit (Cmd-S) and writes all
// non-empty sections to the day log file via saveDay() in lib/log.ts.
//
// Persistence: the full state is saved to localStorage so drafts survive
// page reloads. A stale session from a previous day is detected on
// startMorning() and reset.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { saveDay, todayISO } from "../lib/log";

export type SlotId = string;

interface RitualState {
  drafts: Record<SlotId, string>;
  startedAt: number | null;
  lastSavedAt: number | null;
  saving: boolean;

  startMorning: () => void;
  setDraft: (slotId: SlotId, body: string) => void;
  saveMorning: () => Promise<void>;
  reset: () => void;
}

const EMPTY_STATE = {
  drafts: {} as Record<SlotId, string>,
  startedAt: null as number | null,
  lastSavedAt: null as number | null,
  saving: false,
};

function isSameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export const useRitualStore = create<RitualState>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      startMorning: () => {
        const state = get();
        if (state.startedAt !== null && isSameDay(state.startedAt, Date.now())) {
          return;
        }
        set({
          ...EMPTY_STATE,
          startedAt: Date.now(),
        });
      },

      setDraft: (slotId, body) => {
        set((state) => ({
          drafts: { ...state.drafts, [slotId]: body },
        }));
      },

      saveMorning: async () => {
        const state = get();
        set({ saving: true });
        try {
          const sections = Object.entries(state.drafts)
            .filter(([, body]) => body.trim().length > 0)
            .map(([slot, body]) => ({ slot, body }));
          if (sections.length > 0) {
            await saveDay(todayISO(), sections);
          }
          set({ saving: false, lastSavedAt: Date.now() });
        } catch (err) {
          set({ saving: false });
          throw err;
        }
      },

      reset: () => {
        set(EMPTY_STATE);
      },
    }),
    {
      name: "homebase-state",
      storage: createJSONStorage(() => localStorage),
      // Version 6: renamed from morning-ritual-state to homebase-state for
      // the browser rewrite. Old key is orphaned (manual clear if you care).
      version: 6,
    },
  ),
);
