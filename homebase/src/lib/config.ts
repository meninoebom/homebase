// homebase.config.json — schema, defaults, validation, and disk I/O.
//
// The config lives in the user's log directory next to their day files.
// It travels with the data: backups include it, switching machines means
// re-picking the folder and the config follows automatically. There is
// no sync layer because there is nothing to sync.
//
// Slot ids are stable: they're written into day-file headers (## piano)
// and renaming would orphan history. Display titles are mutable; ids
// are not. The settings UI exposes title only; ids are read-only.

import { readFile, writeFile } from "./fs";

export const CONFIG_FILENAME = "homebase.config.json";

// -- Types --------------------------------------------------------------

export interface HomebaseConfig {
  version: 1;
  slots: SlotConfig[];
  briefing: BriefingConfig;
}

export type SlotConfig = PromptSlotConfig | WorkspaceSlotConfig;

export interface PromptSlotConfig {
  id: string;
  kind: "prompt";
  title?: string;
  prompt: string;
  hints?: string[];
}

export interface WorkspaceSlotConfig {
  id: string;
  kind: "workspace";
  title: string;
  stateLabel?: string;
  prompt?: string;
}

export interface BriefingConfig {
  enabled: boolean;
  quotes: string[];
}

// -- Read / write result types ------------------------------------------

export type ReadConfigResult =
  | { kind: "ok"; config: HomebaseConfig }
  | { kind: "missing" }
  | { kind: "parse-error"; message: string }
  | { kind: "schema-error"; issues: string[] };

// -- Validation ---------------------------------------------------------

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Validate a parsed-JSON value against the HomebaseConfig schema.
 * Returns either a typed config or the list of issues — never throws.
 */
export function validateConfig(
  value: unknown,
): { kind: "ok"; config: HomebaseConfig } | { kind: "schema-error"; issues: string[] } {
  const issues: string[] = [];

  if (!isObject(value)) {
    return { kind: "schema-error", issues: ["config must be a JSON object"] };
  }

  if (value.version !== 1) {
    issues.push(`unsupported version: expected 1, got ${JSON.stringify(value.version)}`);
  }

  if (!Array.isArray(value.slots)) {
    issues.push("slots must be an array");
  } else if (value.slots.length === 0) {
    issues.push("slots must contain at least one entry");
  } else {
    const seenIds = new Set<string>();
    value.slots.forEach((slot, i) => {
      validateSlot(slot, i, seenIds, issues);
    });
  }

  if (!isObject(value.briefing)) {
    issues.push("briefing must be an object");
  } else {
    if (typeof value.briefing.enabled !== "boolean") {
      issues.push("briefing.enabled must be a boolean");
    }
    if (
      !Array.isArray(value.briefing.quotes) ||
      !value.briefing.quotes.every((q) => typeof q === "string")
    ) {
      issues.push("briefing.quotes must be an array of strings");
    }
  }

  if (issues.length > 0) {
    return { kind: "schema-error", issues };
  }

  return { kind: "ok", config: value as unknown as HomebaseConfig };
}

function validateSlot(slot: unknown, index: number, seenIds: Set<string>, issues: string[]): void {
  const at = `slots[${index}]`;
  if (!isObject(slot)) {
    issues.push(`${at} must be an object`);
    return;
  }

  if (typeof slot.id !== "string") {
    issues.push(`${at}.id must be a string`);
  } else if (!ID_PATTERN.test(slot.id)) {
    issues.push(
      `${at}.id "${slot.id}" must match /^[a-z0-9][a-z0-9-]*$/ — lowercase letters, digits, and hyphens only, must start with letter or digit`,
    );
  } else if (seenIds.has(slot.id)) {
    issues.push(`${at}.id "${slot.id}" is duplicated`);
  } else {
    seenIds.add(slot.id);
  }

  if (slot.kind === "prompt") {
    if (typeof slot.prompt !== "string") {
      issues.push(`${at}.prompt must be a string`);
    }
    if (slot.title !== undefined && typeof slot.title !== "string") {
      issues.push(`${at}.title must be a string when present`);
    }
    if (slot.hints !== undefined) {
      if (!Array.isArray(slot.hints) || !slot.hints.every((h) => typeof h === "string")) {
        issues.push(`${at}.hints must be an array of strings when present`);
      }
    }
  } else if (slot.kind === "workspace") {
    if (typeof slot.title !== "string" || slot.title.length === 0) {
      issues.push(`${at}.title is required for workspace slots`);
    }
    if (slot.stateLabel !== undefined && typeof slot.stateLabel !== "string") {
      issues.push(`${at}.stateLabel must be a string when present`);
    }
    if (slot.prompt !== undefined && typeof slot.prompt !== "string") {
      issues.push(`${at}.prompt must be a string when present`);
    }
  } else {
    issues.push(`${at}.kind must be "prompt" or "workspace"`);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// -- Parse / serialize --------------------------------------------------

/** Parse a config JSON string. Returns ok / parse-error / schema-error. */
export function parseConfig(json: string): ReadConfigResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    return {
      kind: "parse-error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
  return validateConfig(parsed);
}

/** Pretty-print a config to JSON with 2-space indentation. */
export function serializeConfig(config: HomebaseConfig): string {
  return JSON.stringify(config, null, 2) + "\n";
}

// -- Defaults -----------------------------------------------------------

/**
 * Neutral starter config for fresh users (empty log dir).
 * No Piano. No Brandon-isms. Time-of-day-neutral copy: someone who
 * uses Homebase as an evening journal or a midday check-in shouldn't
 * trip over "this morning" prompts.
 */
export function defaultConfig(): HomebaseConfig {
  return {
    version: 1,
    slots: [
      {
        id: "dreams",
        kind: "prompt",
        prompt: "What did you dream?",
      },
      {
        id: "inner-weather",
        kind: "prompt",
        title: "Inner Weather",
        prompt: "What's alive in you right now?",
        hints: ["weighing on you", "needs to be said", "giving you life", "gratitude"],
      },
      {
        id: "gratitude",
        kind: "prompt",
        title: "Gratitude",
        prompt: "What are you grateful for today?",
      },
      {
        id: "today",
        kind: "prompt",
        title: "Today",
        prompt: "What's on your mind today?",
      },
    ],
    briefing: {
      enabled: true,
      quotes: [],
    },
  };
}

/**
 * Existing-user migration: mirrors the current hardcoded slot registry
 * verbatim (Dreams · Inner Weather · Morning Practices · Piano · Creative
 * · Orient). Only used when a log dir already contains day files but no
 * config — Brandon's setup, anyone migrating from a pre-config build.
 */
export function legacyDefaultConfig(): HomebaseConfig {
  return {
    version: 1,
    slots: [
      {
        id: "dreams",
        kind: "prompt",
        prompt: "What did you dream?",
      },
      {
        id: "inner-weather",
        kind: "prompt",
        title: "Inner Weather",
        prompt: "What's alive in you this morning?",
        hints: ["weighing on you", "avoiding", "needs to be said", "giving you life", "gratitude"],
      },
      {
        id: "morning-practices",
        kind: "prompt",
        title: "Morning Practices",
        prompt: "Anything about your practices today?",
        hints: ["movement", "meditation", "water", "piano"],
      },
      {
        id: "piano",
        kind: "workspace",
        title: "Piano",
        prompt: "What did you practice? What clicked, what needs work?",
      },
      {
        id: "creative",
        kind: "prompt",
        title: "Creative Projects",
        prompt: "What's surfacing? What's maturing?",
      },
      {
        id: "orient",
        kind: "prompt",
        prompt:
          "According to my deepest understanding, how can I live that understanding more deeply?",
      },
    ],
    briefing: {
      enabled: true,
      quotes: ["The only way to do great work is to love what you do."],
    },
  };
}

// -- Disk I/O -----------------------------------------------------------

/**
 * Read homebase.config.json from the log dir.
 * Returns "missing" when the file doesn't exist (or is empty —
 * empty file == user error, regenerate defaults rather than crash).
 */
export async function readConfig(): Promise<ReadConfigResult> {
  const raw = await readFile(CONFIG_FILENAME);
  if (raw === "") return { kind: "missing" };
  return parseConfig(raw);
}

/** Write homebase.config.json to the log dir. */
export async function writeConfig(config: HomebaseConfig): Promise<void> {
  await writeFile(CONFIG_FILENAME, serializeConfig(config));
}
