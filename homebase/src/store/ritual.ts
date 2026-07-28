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
  migrateLoadedConfig,
  readConfig,
  writeConfig,
  type HomebaseConfig,
} from "../lib/config";
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
  // True when the workspace folder itself can't be reached — a real fs error
  // (revoked permission, folder moved/deleted) on the config read or any
  // config write. Distinct from configError (the file's *contents* are bad,
  // recover by Reset) because the recovery here is to *reconnect the folder*,
  // not rewrite the config. Keeps loadToday from rejecting into day.tsx's
  // `void loadToday()` and hanging the page (#85).
  accessError: boolean;
  loaded: boolean;
  saving: boolean;
  // True when the last autosave write failed. Surfaced inline in the day
  // footer (not the full-page recovery screen — a transient save failure
  // shouldn't yank the user out of their editor). Mirrors the strategy
  // page's saveStatus:"error" → SaveIndicator (#87).
  saveError: boolean;
  // True when the last settings config write (updateConfig) failed. The edit
  // is kept in memory (losing the user's input would be worse) but flagged so
  // the settings page can show it didn't reach disk; cleared on the next
  // successful write (#89).
  configWriteError: boolean;
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

/**
 * True for a "folder unreachable" error (revoked permission), as opposed to a
 * missing file or a content problem. Such an error means the user must
 * reconnect the folder, so it routes to accessError no matter which read/write
 * surfaced it — including a day-file read that fails after the config read
 * already succeeded.
 */
function isAccessError(err: unknown): boolean {
  return (
    err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError")
  );
}

/**
 * Seed a config when the folder has no homebase.config.json.
 *
 * This used to branch: a folder with day files got the author's own legacy
 * slot set, on the theory that its owner was mid-migration from a pre-config
 * build. The starter-practice chooser (#118) took over that job — it writes a
 * config before the app renders — so the only way here now is a config
 * deleted by hand, where the neutral default is right for everybody.
 */
function pickFirstRunConfig(): HomebaseConfig {
  return defaultConfig();
}

export const useRitualStore = create<RitualState>()((set, get) => ({
  drafts: {},
  config: null,
  configError: null,
  draftsError: false,
  accessError: false,
  loaded: false,
  saving: false,
  saveError: false,
  configWriteError: false,
  lastSavedAt: null,

  loadToday: async () => {
    try {
      // Read config first. Three paths:
      //   - missing → seed a default and use it
      //   - parse-error / schema-error → surface as configError; skip drafts
      //     load (the morning page renders the recovery screen instead)
      //   - ok → use it
      let config: HomebaseConfig;
      const result = await readConfig();
      if (result.kind === "missing") {
        config = pickFirstRunConfig();
        await writeConfig(config);
      } else if (result.kind === "parse-error" || result.kind === "schema-error") {
        set({ configError: result, draftsError: false, accessError: false, loaded: true });
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
        // A revoked-permission / folder-gone error here means the whole folder
        // is unreachable (it just happened to surface on the day read after the
        // config read succeeded) — route it to accessError so the user gets the
        // "reconnect your folder" screen, not "today's writing" (#85 review).
        // Any other read failure (e.g. the day file itself is unreadable) stays
        // draftsError.
        if (isAccessError(err)) {
          console.error("ritual: folder unreachable while reading today's day file", err);
          set({ configError: null, draftsError: false, accessError: true, loaded: true });
          return;
        }
        console.error("ritual: failed to read today's day file", err);
        set({
          config,
          configError: null,
          draftsError: true,
          accessError: false,
          drafts: {},
          loaded: true,
        });
        return;
      }
      set({
        config,
        configError: null,
        draftsError: false,
        accessError: false,
        drafts: sections,
        loaded: true,
      });
    } catch (err) {
      // A real fs failure on the config read / first-run seed write / migration
      // write path (revoked permission, folder moved or deleted). Without this
      // the rejection escapes into day.tsx's `void loadToday()` and the page
      // hangs unloaded with no recovery. Surface it as accessError instead (#85).
      console.error("ritual: failed to load homebase config", err);
      set({ accessError: true, configError: null, draftsError: false, loaded: true });
    }
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
      set({ saving: false, saveError: false, lastSavedAt: Date.now() });
    } catch (err) {
      // Autosave runs via `void saveNow()` (day.tsx), so a thrown error here is
      // an unhandled rejection the user never sees, with the footer still
      // showing a stale "saved …". Surface it as saveError instead and keep the
      // drafts intact so the next edit retries. Inline severity on purpose — a
      // transient save failure shouldn't escalate to the full-page recovery
      // screen and pull the user out of their editor (#87).
      console.error("ritual: autosave failed", err);
      set({ saving: false, saveError: true });
    }
  },

  updateConfig: async (updater) => {
    const current = get().config;
    if (!current) return;
    const next = updater(current);
    if (next === current) return;
    set({ config: next }); // optimistic — keep the settings UI responsive
    try {
      await writeConfig(next);
      set({ configWriteError: false });
    } catch (err) {
      // Settings calls this via `await updateConfig(...)` / `void updateConfig(...)`
      // with no catch, so a thrown rejection is unhandled and the change looks
      // saved while disk never changed. Keep the in-memory edit (discarding the
      // user's input would be worse) but flag it so the settings page shows it
      // didn't persist; the next successful edit clears the flag (#89).
      // Surfaced inline (configWriteError → banner) rather than the full-page
      // accessError even for a folder-access failure: on the settings page the
      // user is already where they'd reconnect (the Your folder section).
      console.error("ritual: failed to write config", err);
      set({ configWriteError: true });
    }
  },

  resetToDefaults: async () => {
    // Recovery action — overwrite homebase.config.json with a clean
    // neutral default. Day-file content is left alone. After write,
    // re-run loadToday so the page picks up the new config.
    const fresh = defaultConfig();
    try {
      await writeConfig(fresh);
    } catch (err) {
      // The folder became unreachable — don't let the recovery button silently
      // no-op (it's invoked via `void resetToDefaults()`). Surface accessError.
      console.error("ritual: failed to write config on reset", err);
      set({ accessError: true, configError: null, loaded: true });
      return;
    }
    set({ configError: null, configWriteError: false });
    await get().loadToday();
  },
}));
