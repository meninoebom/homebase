import { describe, expect, it } from "vite-plus/test";
import {
  defaultConfig,
  legacyDefaultConfig,
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

  it("accepts the legacyDefaultConfig", () => {
    expect(validateConfig(legacyDefaultConfig()).kind).toBe("ok");
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
    const original = legacyDefaultConfig();
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

describe("legacyDefaultConfig", () => {
  it("includes piano as a workspace slot", () => {
    const piano = legacyDefaultConfig().slots.find((s) => s.id === "piano");
    expect(piano?.kind).toBe("workspace");
  });

  it("includes the existing briefing quote so Brandon's setup looks identical post-migration", () => {
    const config = legacyDefaultConfig();
    expect(config.briefing.quotes.length).toBeGreaterThan(0);
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

describe("type narrowing", () => {
  it("narrows by kind via discriminated union", () => {
    const config: HomebaseConfig = legacyDefaultConfig();
    for (const slot of config.slots) {
      if (slot.kind === "prompt") {
        expect(typeof slot.prompt).toBe("string");
      } else if (slot.kind === "workspace") {
        expect(typeof slot.title).toBe("string");
      }
    }
  });
});
