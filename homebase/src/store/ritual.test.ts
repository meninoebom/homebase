import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
import type { HomebaseConfig, ReadConfigResult } from "../lib/config";

// Per-test mocks. These are reset in beforeEach, then individual tests
// configure the readConfig response, the listTopLevelFiles result, and
// the readDaySections payload they want.

let mockReadConfig: () => Promise<ReadConfigResult>;
let mockWriteConfig: (config: HomebaseConfig) => Promise<void>;
let mockListFiles: () => Promise<string[]>;
let mockReadDaySections: () => Promise<Record<string, string>>;

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
  saveDay: () => Promise.resolve(),
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
  // Reset singleton state between tests.
  useRitualStore.setState({
    drafts: {},
    config: null,
    configError: null,
    loaded: false,
    saving: false,
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
});

describe("resetToDefaults", () => {
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
