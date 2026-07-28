import { describe, expect, it } from "vite-plus/test";
import {
  configFromPreset,
  DEFAULT_PRESET_ID,
  defaultConfig,
  findLayoutPreset,
  layoutPresets,
  migrateLoadedConfig,
  parseConfig,
  serializeConfig,
  validateConfig,
  type HomebaseConfig,
} from "./config";

describe("validateConfig", () => {
  it("accepts the defaultConfig", () => {
    expect(validateConfig(defaultConfig()).kind).toBe("ok");
  });

  it("accepts every starter practice", () => {
    for (const preset of layoutPresets()) {
      expect(validateConfig(configFromPreset(preset)).kind).toBe("ok");
    }
  });

  it("rejects non-objects", () => {
    expect(validateConfig(null).kind).toBe("schema-error");
    expect(validateConfig("string").kind).toBe("schema-error");
    expect(validateConfig([]).kind).toBe("schema-error");
  });

  it("rejects wrong version", () => {
    const result = validateConfig({ ...defaultConfig(), version: 2 });
    expect(result.kind).toBe("schema-error");
    if (result.kind === "schema-error") {
      expect(result.issues.some((i) => i.includes("version"))).toBe(true);
    }
  });

  it("rejects an empty slots array", () => {
    const result = validateConfig({ ...defaultConfig(), slots: [] });
    expect(result.kind).toBe("schema-error");
    if (result.kind === "schema-error") {
      expect(result.issues.some((i) => i.includes("at least one"))).toBe(true);
    }
  });

  it("rejects duplicate slot ids", () => {
    const config = {
      ...defaultConfig(),
      slots: [
        { id: "x", kind: "prompt", prompt: "a" },
        { id: "x", kind: "prompt", prompt: "b" },
      ],
    };
    const result = validateConfig(config);
    expect(result.kind).toBe("schema-error");
    if (result.kind === "schema-error") {
      expect(result.issues.some((i) => i.includes("duplicated"))).toBe(true);
    }
  });

  it("rejects bad id formats", () => {
    const cases = ["UpperCase", "with space", "with/slash", "-leading-dash", ""];
    for (const id of cases) {
      const result = validateConfig({
        ...defaultConfig(),
        slots: [{ id, kind: "prompt", prompt: "p" }],
      });
      expect(result.kind, `id "${id}" should be rejected`).toBe("schema-error");
    }
  });

  it("accepts well-formed slot ids", () => {
    const cases = ["dreams", "inner-weather", "x", "1", "slot-1", "0-thing"];
    for (const id of cases) {
      const result = validateConfig({
        ...defaultConfig(),
        slots: [{ id, kind: "prompt", prompt: "p" }],
      });
      expect(result.kind, `id "${id}" should be accepted`).toBe("ok");
    }
  });

  it("rejects unknown slot kinds", () => {
    const result = validateConfig({
      ...defaultConfig(),
      slots: [{ id: "x", kind: "mystery", prompt: "p" }],
    });
    expect(result.kind).toBe("schema-error");
    if (result.kind === "schema-error") {
      expect(result.issues.some((i) => i.includes('"prompt" or "workspace"'))).toBe(true);
    }
  });

  it("requires title on workspace slots", () => {
    const result = validateConfig({
      ...defaultConfig(),
      slots: [{ id: "p", kind: "workspace" }],
    });
    expect(result.kind).toBe("schema-error");
  });

  it("allows missing title on prompt slots", () => {
    const result = validateConfig({
      ...defaultConfig(),
      slots: [{ id: "p", kind: "prompt", prompt: "ok" }],
    });
    expect(result.kind).toBe("ok");
  });

  it("rejects malformed briefing", () => {
    const result = validateConfig({
      ...defaultConfig(),
      briefing: { enabled: "yes", quotes: [1, 2, 3] },
    });
    expect(result.kind).toBe("schema-error");
  });

  it("rejects hints that aren't string arrays", () => {
    const result = validateConfig({
      ...defaultConfig(),
      slots: [{ id: "p", kind: "prompt", prompt: "p", hints: [1, 2] }],
    });
    expect(result.kind).toBe("schema-error");
  });
});

describe("parseConfig", () => {
  it("returns parse-error for invalid JSON", () => {
    const result = parseConfig("{not json}");
    expect(result.kind).toBe("parse-error");
    if (result.kind === "parse-error") {
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it("returns ok for valid config JSON", () => {
    const json = serializeConfig(defaultConfig());
    expect(parseConfig(json).kind).toBe("ok");
  });

  it("returns schema-error for valid JSON with bad shape", () => {
    expect(parseConfig('{"version": 99}').kind).toBe("schema-error");
  });
});

describe("serializeConfig", () => {
  it("round-trips through parseConfig", () => {
    const original = configFromPreset(layoutPresets()[1]);
    const json = serializeConfig(original);
    const parsed = parseConfig(json);
    expect(parsed.kind).toBe("ok");
    if (parsed.kind === "ok") {
      expect(parsed.config).toEqual(original);
    }
  });

  it("produces pretty-printed JSON ending in a newline", () => {
    const json = serializeConfig(defaultConfig());
    expect(json.endsWith("\n")).toBe(true);
    expect(json).toContain("\n  ");
  });
});

describe("defaultConfig", () => {
  it("ships at least one slot and no Piano", () => {
    const config = defaultConfig();
    expect(config.slots.length).toBeGreaterThan(0);
    expect(config.slots.find((s) => s.id === "piano")).toBeUndefined();
  });

  it("ships a curated briefing rotation so new users see something meaningful on day one", () => {
    const config = defaultConfig();
    expect(config.briefing.enabled).toBe(true);
    expect(config.briefing.quotes.length).toBeGreaterThan(0);
  });
});

describe("shipped defaults", () => {
  // The author's own layout used to ship as legacyDefaultConfig() and could
  // reach a stranger's screen. No shipped default should carry it back in.
  it("carry no personal sections", () => {
    const configs = [defaultConfig(), ...layoutPresets().map(configFromPreset)];
    for (const config of configs) {
      const ids = config.slots.map((s) => s.id);
      expect(ids).not.toContain("piano");
      expect(ids).not.toContain("morning-practices");
    }
  });
});

describe("migrateLoadedConfig", () => {
  function withQuotes(quotes: string[]): HomebaseConfig {
    return {
      ...defaultConfig(),
      briefing: { enabled: true, quotes },
    };
  }

  it("backfills the curated rotation when quotes is exactly the legacy Jobs quote", () => {
    const before = withQuotes(["The only way to do great work is to love what you do."]);
    const { config, migrated } = migrateLoadedConfig(before);
    expect(migrated).toBe(true);
    expect(config.briefing.quotes.length).toBeGreaterThan(1);
    expect(config.briefing.quotes).not.toContain(
      "The only way to do great work is to love what you do.",
    );
  });

  it("backfills the curated rotation when quotes is empty", () => {
    const { config, migrated } = migrateLoadedConfig(withQuotes([]));
    expect(migrated).toBe(true);
    expect(config.briefing.quotes.length).toBeGreaterThan(1);
  });

  it("leaves a deliberately curated list untouched", () => {
    const mine = ["my favorite quote", "another one I picked"];
    const before = withQuotes(mine);
    const { config, migrated } = migrateLoadedConfig(before);
    expect(migrated).toBe(false);
    expect(config.briefing.quotes).toEqual(mine);
  });

  it("leaves a list with the legacy quote plus user additions untouched", () => {
    const mine = ["The only way to do great work is to love what you do.", "one I added"];
    const { config, migrated } = migrateLoadedConfig(withQuotes(mine));
    expect(migrated).toBe(false);
    expect(config.briefing.quotes).toEqual(mine);
  });

  it("is idempotent — re-running on a migrated config returns migrated:false", () => {
    const first = migrateLoadedConfig(withQuotes([]));
    expect(first.migrated).toBe(true);
    const second = migrateLoadedConfig(first.config);
    expect(second.migrated).toBe(false);
    expect(second.config.briefing.quotes).toEqual(first.config.briefing.quotes);
  });

  it("preserves briefing.enabled and other config fields", () => {
    const before: HomebaseConfig = {
      ...withQuotes([]),
      briefing: { enabled: false, quotes: [] },
    };
    const { config } = migrateLoadedConfig(before);
    expect(config.briefing.enabled).toBe(false);
    expect(config.slots).toEqual(before.slots);
  });
});

describe("layout presets", () => {
  it("offers the four named starter practices", () => {
    const ids = layoutPresets().map((p) => p.id);
    expect(ids).toEqual(["morning-ritual", "evening-shutdown", "five-minutes", "plain-page"]);
  });

  it("defaults to Morning ritual so clicking through keeps today's behavior", () => {
    expect(DEFAULT_PRESET_ID).toBe("morning-ritual");
    const preset = findLayoutPreset(DEFAULT_PRESET_ID);
    expect(preset).toBeDefined();
    // Morning ritual installs exactly today's default section layout.
    expect(preset?.slots).toEqual(defaultConfig().slots);
  });

  it("every preset produces a config that passes validateConfig", () => {
    for (const preset of layoutPresets()) {
      const result = validateConfig(configFromPreset(preset));
      expect(result.kind, `preset "${preset.id}" should validate`).toBe("ok");
    }
  });

  it("every preset has unique section ids within itself", () => {
    for (const preset of layoutPresets()) {
      const ids = preset.slots.map((s) => s.id);
      expect(new Set(ids).size, `preset "${preset.id}" has a duplicate section id`).toBe(
        ids.length,
      );
    }
  });

  it("every preset has a title and a non-empty description", () => {
    for (const preset of layoutPresets()) {
      expect(preset.title.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
    }
  });

  it("configFromPreset ships the curated briefing rotation", () => {
    const preset = findLayoutPreset("plain-page");
    expect(preset).toBeDefined();
    if (!preset) return;
    const config = configFromPreset(preset);
    expect(config.briefing.enabled).toBe(true);
    expect(config.briefing.quotes.length).toBeGreaterThan(1);
  });

  it("configFromPreset copies section data so the preset can't be mutated", () => {
    const preset = findLayoutPreset("five-minutes");
    expect(preset).toBeDefined();
    if (!preset) return;
    const config = configFromPreset(preset);
    config.slots[0].id = "mutated";
    // The shared preset data must be untouched.
    expect(findLayoutPreset("five-minutes")?.slots[0].id).not.toBe("mutated");
  });

  it("findLayoutPreset returns undefined for an unknown id", () => {
    expect(findLayoutPreset("does-not-exist")).toBeUndefined();
  });

  it("Plain page reuses the stable 'today' section id from the default layout", () => {
    // "today" is written into day-file headers; the plain-page preset must
    // keep it so a user's history stays consistent across practices.
    expect(findLayoutPreset("plain-page")?.slots[0].id).toBe("today");
  });
});

describe("type narrowing", () => {
  it("narrows by kind via discriminated union", () => {
    // Built inline rather than from a shipped default: no starter practice
    // includes a workspace slot, so a default-derived config would leave the
    // workspace branch of the union unexercised.
    const config: HomebaseConfig = {
      ...defaultConfig(),
      slots: [
        { id: "a-prompt", kind: "prompt", prompt: "What's on your mind?" },
        { id: "a-workspace", kind: "workspace", title: "A workspace" },
      ],
    };
    for (const slot of config.slots) {
      if (slot.kind === "prompt") {
        expect(typeof slot.prompt).toBe("string");
      } else if (slot.kind === "workspace") {
        expect(typeof slot.title).toBe("string");
      }
    }
  });
});
