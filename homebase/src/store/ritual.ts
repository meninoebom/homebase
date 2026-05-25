// Zustand store for the Homebase hub.
//
// Owns three things:
//   1. The user's HomebaseConfig (read from disk, written on first run)
//   2. Today's drafts (per-slot writing-field content)
//   3. Save status / last-saved timestamp
//
// `loaded` flips true only after both config and drafts have been read,
// so the morning page never mounts editors against empty initialContent
// and then silently drops the disk content when it arrives.

import { create } from "zustand";
import {
  defaultConfig,
  legacyDefaultConfig,
  migrateLoadedConfig,
  readConfig,
  writeConfig,
  type HomebaseConfig,
} from "../lib/config";
import { listTopLevelFiles } from "../lib/fs";
import { readDaySections, saveDay, todayISO } from "../lib/log";

export type SlotId = string;

export type ConfigError =
  | { kind: "parse-error"; message: string }
  | { kind: "schema-error"; issues: string[] };

interface RitualState {
  drafts: Record<SlotId, string>;
  config: HomebaseConfig | null;
  configError: ConfigError | null;
  // True when today's day file failed to READ with a real error (not a
  // missing file, which readDaySections maps to {}). Like configError, the
  // day page renders a recovery screen instead of editors — otherwise the
  // user could write into a blank-looking day and overwrite content that's
  // merely unreadable right now (#83, sibling of #80).
  draftsError: boolean;
  loaded: boolean;
  saving: boolean;
  lastSavedAt: number | null;

  loadToday: () => Promise<void>;
  setDraft: (slotId: SlotId, body: string) => void;
  saveNow: () => Promise<void>;
  resetToDefaults: () => Promise<void>;

  /**
   * Mutate the config in-memory and persist to disk. Used by the
   * settings page for reorder / add / remove / edit. The updater is
   * called with the current config; if it returns the same reference
   * (no change), no write happens.
   */
  updateConfig: (updater: (config: HomebaseConfig) => HomebaseConfig) => Promise<void>;
}

const DAY_FILE_PATTERN = /^\d{4}-\d{2}-\d{2}\.md$/;

/**
 * Decide which default config to seed when the user has no
 * homebase.config.json yet. If the log dir already has day files, the
 * user is mid-flow on a pre-config build (Brandon, anyone migrating)
 * — give them the legacy slot set so nothing visibly changes. Otherwise
 * they're a fresh install — give them the neutral default.
 */
async function pickFirstRunConfig(): Promise<HomebaseConfig> {
  const files = await listTopLevelFiles();
  const hasExistingDays = files.some((name) => DAY_FILE_PATTERN.test(name));
  return hasExistingDays ? legacyDefaultConfig() : defaultConfig();
}

export const useRitualStore = create<RitualState>()((set, get) => ({
  drafts: {},
  config: null,
  configError: null,
  draftsError: false,
  loaded: false,
  saving: false,
  lastSavedAt: null,

  loadToday: async () => {
    // Read config first. Three paths:
    //   - missing → seed a default and use it
    //   - parse-error / schema-error → surface as configError; skip drafts
    //     load (the morning page renders the recovery screen instead)
    //   - ok → use it
    let config: HomebaseConfig;
    const result = await readConfig();
    if (result.kind === "missing") {
      config = await pickFirstRunConfig();
      await writeConfig(config);
    } else if (result.kind === "parse-error" || result.kind === "schema-error") {
      set({ configError: result, draftsError: false, loaded: true });
      return;
    } else {
      const migration = migrateLoadedConfig(result.config);
      config = migration.config;
      if (migration.migrated) {
        await writeConfig(config);
      }
    }

    // A real day-file read error (not a missing file — readDaySections maps
    // that to {}) must not pass for an empty day. Surface it as draftsError so
    // the page renders a recovery screen instead of editable, overwriteable
    // fields; loaded stays true so the page doesn't hang, and a retry re-reads.
    let sections: Record<SlotId, string>;
    try {
      sections = await readDaySections(todayISO());
    } catch (err) {
      console.error("ritual: failed to read today's day file", err);
      set({ config, configError: null, draftsError: true, drafts: {}, loaded: true });
      return;
    }
    set({ config, configError: null, draftsError: false, drafts: sections, loaded: true });
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

  updateConfig: async (updater) => {
    const current = get().config;
    if (!current) return;
    const next = updater(current);
    if (next === current) return;
    set({ config: next });
    await writeConfig(next);
  },

  resetToDefaults: async () => {
    // Recovery action — overwrite homebase.config.json with a clean
    // neutral default. Day-file content is left alone. After write,
    // re-run loadToday so the page picks up the new config.
    const fresh = defaultConfig();
    await writeConfig(fresh);
    set({ configError: null });
    await get().loadToday();
  },
}));
