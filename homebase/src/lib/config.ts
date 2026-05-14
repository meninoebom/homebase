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

// -- Migrations ---------------------------------------------------------

/**
 * Legacy seed: the single Steve Jobs quote that pre-curation builds
 * shipped as the entire briefing rotation. We match against this exact
 * value so the backfill only touches configs that were never actually
 * customized by the user.
 */
const LEGACY_SINGLE_QUOTE = "The only way to do great work is to love what you do.";

/**
 * One-time backfill for users who landed before the curated briefing
 * rotation shipped. Replaces `briefing.quotes` with the default
 * rotation if and only if the existing list is empty or contains
 * exactly the legacy single-Jobs-quote — never overwrites a list the
 * user has deliberately curated.
 *
 * Returns `{ config, migrated }` so the caller can persist the result
 * exactly once. Idempotent: after migration the quotes no longer
 * match the legacy pattern, so subsequent calls are no-ops.
 */
export function migrateLoadedConfig(config: HomebaseConfig): {
  config: HomebaseConfig;
  migrated: boolean;
} {
  const quotes = config.briefing.quotes;
  const isLegacyOnly = quotes.length === 1 && quotes[0] === LEGACY_SINGLE_QUOTE;
  if (quotes.length !== 0 && !isLegacyOnly) {
    return { config, migrated: false };
  }
  return {
    config: {
      ...config,
      briefing: { ...config.briefing, quotes: [...DEFAULT_BRIEFING_QUOTES] },
    },
    migrated: true,
  };
}

// -- Defaults -----------------------------------------------------------

/**
 * Neutral starter config for fresh users (empty log dir).
 * No Piano. No Brandon-isms. Time-of-day-neutral copy: someone who
 * uses Homebase as an evening journal or a midday check-in shouldn't
 * trip over "this morning" prompts.
 *
 * Ships with a curated briefing rotation drawn from non-dual,
 * contemplative, and deeper Stoic traditions so new users see
 * something meaningful before they've customized anything.
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
      quotes: [...DEFAULT_BRIEFING_QUOTES],
    },
  };
}

/**
 * Curated briefing quotes — non-dual, contemplative, deeper Stoic.
 * Tone: disciplined, courageous, soulful. Shipped as the default
 * rotation; users can replace or extend via Settings.
 */
const DEFAULT_BRIEFING_QUOTES: ReadonlyArray<string> = [
  "The wound is the place where the Light enters you. — Rumi",
  "Set your life on fire. Seek those who fan your flames. — Rumi",
  "The Self, ever radiant, dances in every act of seeing, knowing, doing. — Abhinavagupta",
  "To study the self is to forget the self. To forget the self is to be enlightened by all things. — Dōgen",
  "If you cannot find the truth right where you are, where else do you expect to find it? — Dōgen",
  "Your own Self-realization is the greatest service you can render the world. — Ramana Maharshi",
  "Wisdom tells me I am nothing. Love tells me I am everything. Between the two, my life flows. — Nisargadatta Maharaj",
  "I wish I could show you, when you are lonely or in darkness, the astonishing light of your own being. — Hafiz",
  "Mastering others is strength; mastering yourself is true power. — Lao Tzu",
  "Flow with whatever may happen and let your mind be free. Stay centered by accepting whatever you are doing. — Chuang Tzu",
  "Waste no more time arguing what a good man should be. Be one. — Marcus Aurelius",
  "Difficulties strengthen the mind, as labor does the body. — Seneca",
  "Only to the extent that we expose ourselves over and over to annihilation can that which is indestructible in us be found. — Pema Chödrön",
  "The essence of warriorship is refusing to give up on anyone or anything. — Chögyam Trungpa",
  "The most precious gift we can offer anyone is our attention. — Thich Nhat Hanh",
  "If a problem can be solved, why worry? If it cannot be solved, what use is there in worrying? — Shantideva",
  "Wherever you are is the entry point. — Kabir",
  "Perhaps all the dragons in our lives are princesses who are only waiting to see us act, just once, with beauty and courage. — Rainer Maria Rilke",
  "Not knowing how near the truth is, we seek it far away — what a pity. — Hakuin",
  "The mind unborn does not arise; it does not pass away. Stop trying to grasp it, and it is right here. — Bankei",
];

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
      quotes: [...DEFAULT_BRIEFING_QUOTES],
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
