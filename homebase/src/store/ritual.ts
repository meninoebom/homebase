// Zustand store for the Homebase hub.
//
// Drafts are in-memory only. On mount, today's file is read and drafts are
// populated from it. Changes are auto-saved to disk via a debounced effect
// in morning.tsx — no manual Cmd-S required, no localStorage.

import { create } from "zustand";
import { readDaySections, saveDay, todayISO } from "../lib/log";

export type SlotId = string;

interface RitualState {
  drafts: Record<SlotId, string>;
  loaded: boolean;
  saving: boolean;
  lastSavedAt: number | null;

  loadToday: () => Promise<void>;
  setDraft: (slotId: SlotId, body: string) => void;
  saveNow: () => Promise<void>;
}

export const useRitualStore = create<RitualState>()((set, get) => ({
  drafts: {},
  loaded: false,
  saving: false,
  lastSavedAt: null,

  loadToday: async () => {
    const sections = await readDaySections(todayISO());
    // CodeMirror is uncontrolled: each RitualEditor seeds its doc once at
    // mount from initialContent. If we render slots before `loaded` is true,
    // every editor gets an empty doc and never picks up the disk content
    // when it arrives — silent data loss on each new tab.
    set({ drafts: sections, loaded: true });
  },

  setDraft: (slotId, body) => {
    set((state) => ({
      drafts: { ...state.drafts, [slotId]: body },
    }));
  },

  saveNow: async () => {
    const { drafts } = get();
    const sections = Object.entries(drafts)
      .filter(([, body]) => body.trim().length > 0)
      .map(([slot, body]) => ({ slot, body }));
    if (sections.length === 0) return;
    set({ saving: true });
    try {
      await saveDay(todayISO(), sections);
      set({ saving: false, lastSavedAt: Date.now() });
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },
}));
