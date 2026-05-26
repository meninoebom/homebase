import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
import type { HomebaseConfig, ReadConfigResult } from "../lib/config";

// Per-test mocks. These are reset in beforeEach, then individual tests
// configure the readConfig response, the listTopLevelFiles result, and
// the readDaySections payload they want.

let mockReadConfig: () => Promise<ReadConfigResult>;
let mockWriteConfig: (config: HomebaseConfig) => Promise<void>;
let mockListFiles: () => Promise<string[]>;
let mockReadDaySections: () => Promise<Record<string, string>>;
let mockSaveDay: () => Promise<void>;

vi.mock("../lib/config", async () => {
  const actual = await vi.importActual<typeof import("../lib/config")>("../lib/config");
  return {
    ...actual,
    readConfig: () => mockReadConfig(),
    writeConfig: (c: HomebaseConfig) => mockWriteConfig(c),
  };
});

vi.mock("../lib/fs", () => ({
  listTopLevelFiles: () => mockListFiles(),
}));

vi.mock("../lib/log", () => ({
  readDaySections: () => mockReadDaySections(),
  saveDay: () => mockSaveDay(),
  todayISO: () => "2026-05-08",
}));

// Import AFTER mocks so the store picks them up.
const { useRitualStore } = await import("./ritual");
const { defaultConfig, legacyDefaultConfig } = await import("../lib/config");

beforeEach(() => {
  mockReadConfig = () => Promise.resolve({ kind: "missing" });
  mockWriteConfig = () => Promise.resolve();
  mockListFiles = () => Promise.resolve([]);
  mockReadDaySections = () => Promise.resolve({});
  mockSaveDay = () => Promise.resolve();
  // Reset singleton state between tests.
  useRitualStore.setState({
    drafts: {},
    config: null,
    configError: null,
    draftsError: false,
    accessError: false,
    loaded: false,
    saving: false,
    saveError: false,
    lastSavedAt: null,
  });
});

describe("loadToday — config seeding", () => {
  it("writes defaultConfig() when the log dir is empty (fresh user)", async () => {
    const writes: HomebaseConfig[] = [];
    mockWriteConfig = (c) => {
      writes.push(c);
      return Promise.resolve();
    };
    mockListFiles = () => Promise.resolve([]);

    await useRitualStore.getState().loadToday();

    expect(writes).toHaveLength(1);
    expect(writes[0]).toEqual(defaultConfig());
    expect(useRitualStore.getState().config).toEqual(defaultConfig());
  });

  it("writes legacyDefaultConfig() when day files already exist (existing user)", async () => {
    const writes: HomebaseConfig[] = [];
    mockWriteConfig = (c) => {
      writes.push(c);
      return Promise.resolve();
    };
    mockListFiles = () => Promise.resolve(["2026-05-07.md", "2026-05-08.md", "README.md"]);

    await useRitualStore.getState().loadToday();

    expect(writes).toHaveLength(1);
    expect(writes[0]).toEqual(legacyDefaultConfig());
  });

  it("ignores non-day-file names when deciding fresh vs. legacy", async () => {
    const writes: HomebaseConfig[] = [];
    mockWriteConfig = (c) => {
      writes.push(c);
      return Promise.resolve();
    };
    // README and the config file itself shouldn't trigger legacy migration.
    mockListFiles = () => Promise.resolve(["README.md", "homebase.config.json", ".DS_Store"]);

    await useRitualStore.getState().loadToday();

    expect(writes[0]).toEqual(defaultConfig());
  });

  it("uses the existing config when readConfig returns ok", async () => {
    const existing = defaultConfig();
    mockReadConfig = () => Promise.resolve({ kind: "ok", config: existing });
    let wrote = false;
    mockWriteConfig = () => {
      wrote = true;
      return Promise.resolve();
    };

    await useRitualStore.getState().loadToday();

    expect(wrote).toBe(false);
    expect(useRitualStore.getState().config).toEqual(existing);
  });
});

describe("loadToday — error handling", () => {
  it("surfaces parse-error as configError and skips drafts load", async () => {
    mockReadConfig = () => Promise.resolve({ kind: "parse-error", message: "bad json at line 3" });
    let draftsRead = false;
    mockReadDaySections = () => {
      draftsRead = true;
      return Promise.resolve({});
    };

    await useRitualStore.getState().loadToday();

    const state = useRitualStore.getState();
    expect(state.configError?.kind).toBe("parse-error");
    expect(state.config).toBeNull();
    expect(state.loaded).toBe(true);
    expect(draftsRead).toBe(false);
  });

  it("surfaces schema-error as configError", async () => {
    mockReadConfig = () =>
      Promise.resolve({ kind: "schema-error", issues: ["slots must contain at least one entry"] });

    await useRitualStore.getState().loadToday();

    const state = useRitualStore.getState();
    expect(state.configError?.kind).toBe("schema-error");
    if (state.configError?.kind === "schema-error") {
      expect(state.configError.issues).toContain("slots must contain at least one entry");
    }
  });

  it("surfaces a day-file read failure as draftsError without hanging or losing content", async () => {
    // Config loads fine; the DAY file itself is unreadable (e.g. an I/O error,
    // NOT a missing file → {} and NOT a permission error → accessError). This
    // is the "this specific file is broken" case that draftsError owns.
    mockReadConfig = () => Promise.resolve({ kind: "ok", config: defaultConfig() });
    mockReadDaySections = () =>
      Promise.reject(new DOMException("disk read failed", "NotReadableError"));

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Must NOT reject — day.tsx calls `void loadToday()`; an internal reject
    // would be an unhandled rejection and the page would hang unloaded.
    await expect(useRitualStore.getState().loadToday()).resolves.toBeUndefined();

    const state = useRitualStore.getState();
    expect(state.draftsError).toBe(true);
    expect(state.loaded).toBe(true); // page renders the recovery, doesn't hang
    expect(state.drafts).toEqual({}); // no phantom drafts to overwrite the file with
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("clears draftsError once the day file reads successfully on retry", async () => {
    mockReadConfig = () => Promise.resolve({ kind: "ok", config: defaultConfig() });
    let shouldFail = true;
    mockReadDaySections = () =>
      shouldFail
        ? Promise.reject(new DOMException("disk read failed", "NotReadableError"))
        : Promise.resolve({ intro: "today's words" });

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await useRitualStore.getState().loadToday();
    expect(useRitualStore.getState().draftsError).toBe(true);

    shouldFail = false;
    await useRitualStore.getState().loadToday();
    spy.mockRestore();

    const state = useRitualStore.getState();
    expect(state.draftsError).toBe(false);
    expect(state.drafts).toEqual({ intro: "today's words" });
  });

  it("routes a permission failure during the day read to accessError, not draftsError", async () => {
    // Permission revoked after the config read succeeded but before the day
    // read — the folder is unreachable, so the user needs the reconnect screen,
    // not "today's writing couldn't be opened".
    mockReadConfig = () => Promise.resolve({ kind: "ok", config: defaultConfig() });
    mockReadDaySections = () =>
      Promise.reject(new DOMException("permission revoked", "NotAllowedError"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await useRitualStore.getState().loadToday();
    spy.mockRestore();

    const state = useRitualStore.getState();
    expect(state.accessError).toBe(true);
    expect(state.draftsError).toBe(false);
    expect(state.loaded).toBe(true);
  });
});

describe("loadToday — folder access errors", () => {
  it("surfaces a config-read access failure as accessError instead of hanging", async () => {
    // readConfig rejects (revoked permission / folder gone) — NOT a missing
    // file (that's readConfig → { kind: "missing" }). Must not reject out of
    // loadToday, where day.tsx's `void loadToday()` would drop it.
    mockReadConfig = () =>
      Promise.reject(new DOMException("permission revoked", "NotAllowedError"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(useRitualStore.getState().loadToday()).resolves.toBeUndefined();

    const state = useRitualStore.getState();
    expect(state.accessError).toBe(true);
    expect(state.loaded).toBe(true); // page renders recovery, doesn't hang
    expect(state.configError).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("surfaces a first-run config write failure as accessError", async () => {
    mockReadConfig = () => Promise.resolve({ kind: "missing" });
    mockListFiles = () => Promise.resolve([]);
    mockWriteConfig = () => Promise.reject(new DOMException("denied", "NotAllowedError"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(useRitualStore.getState().loadToday()).resolves.toBeUndefined();

    expect(useRitualStore.getState().accessError).toBe(true);
    expect(useRitualStore.getState().loaded).toBe(true);
    spy.mockRestore();
  });

  it("surfaces a migration write failure as accessError", async () => {
    // Existing config that needs migrating (empty quotes triggers migrated:true),
    // so loadToday takes the migration-write branch — which can also hit a dead
    // folder.
    mockReadConfig = () =>
      Promise.resolve({
        kind: "ok",
        config: { ...defaultConfig(), briefing: { enabled: true, quotes: [] } },
      });
    mockWriteConfig = () => Promise.reject(new DOMException("denied", "NotAllowedError"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(useRitualStore.getState().loadToday()).resolves.toBeUndefined();

    expect(useRitualStore.getState().accessError).toBe(true);
    spy.mockRestore();
  });

  it("clears accessError once a later load succeeds", async () => {
    let shouldFail = true;
    mockReadConfig = () =>
      shouldFail
        ? Promise.reject(new DOMException("denied", "NotAllowedError"))
        : Promise.resolve({ kind: "ok", config: defaultConfig() });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await useRitualStore.getState().loadToday();
    expect(useRitualStore.getState().accessError).toBe(true);

    shouldFail = false;
    await useRitualStore.getState().loadToday();
    spy.mockRestore();

    expect(useRitualStore.getState().accessError).toBe(false);
    expect(useRitualStore.getState().config).toEqual(defaultConfig());
  });
});

describe("resetToDefaults", () => {
  it("surfaces accessError when the write fails instead of silently no-op'ing", async () => {
    useRitualStore.setState({ configError: { kind: "parse-error", message: "x" }, loaded: true });
    mockWriteConfig = () => Promise.reject(new DOMException("denied", "NotAllowedError"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Must not reject — day.tsx calls `() => void resetToDefaults()`.
    await expect(useRitualStore.getState().resetToDefaults()).resolves.toBeUndefined();

    expect(useRitualStore.getState().accessError).toBe(true);
    spy.mockRestore();
  });

  it("writes defaultConfig() and clears configError", async () => {
    useRitualStore.setState({
      configError: { kind: "parse-error", message: "broken" },
      loaded: true,
    });
    const writes: HomebaseConfig[] = [];
    mockWriteConfig = (c) => {
      writes.push(c);
      return Promise.resolve();
    };
    // After reset, loadToday is called again — it'll see the freshly-written
    // config via readConfig returning ok.
    let firstRead = true;
    mockReadConfig = () => {
      if (firstRead) {
        firstRead = false;
        return Promise.resolve({ kind: "missing" });
      }
      return Promise.resolve({ kind: "ok", config: defaultConfig() });
    };

    await useRitualStore.getState().resetToDefaults();

    // First write is from resetToDefaults itself; second is from the
    // re-entered loadToday seeing readConfig returning "missing".
    expect(writes.length).toBeGreaterThanOrEqual(1);
    expect(writes[0]).toEqual(defaultConfig());
    expect(useRitualStore.getState().configError).toBeNull();
  });
});

describe("saveNow — autosave failures", () => {
  it("surfaces a write failure as saveError without throwing or dropping the draft", async () => {
    mockSaveDay = () => Promise.reject(new DOMException("denied", "NotAllowedError"));
    useRitualStore.getState().setDraft("intro", "morning words");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // day.tsx fires `void saveNow()` — it must not reject.
    await expect(useRitualStore.getState().saveNow()).resolves.toBeUndefined();

    const state = useRitualStore.getState();
    expect(state.saveError).toBe(true);
    expect(state.saving).toBe(false);
    expect(state.drafts.intro).toBe("morning words"); // draft kept for retry
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("clears saveError on the next successful save", async () => {
    let shouldFail = true;
    mockSaveDay = () => (shouldFail ? Promise.reject(new Error("io")) : Promise.resolve());
    useRitualStore.getState().setDraft("intro", "words");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await useRitualStore.getState().saveNow();
    expect(useRitualStore.getState().saveError).toBe(true);

    shouldFail = false;
    await useRitualStore.getState().saveNow();
    spy.mockRestore();

    const state = useRitualStore.getState();
    expect(state.saveError).toBe(false);
    expect(state.lastSavedAt).not.toBeNull();
  });
});
