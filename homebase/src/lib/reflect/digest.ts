// Build a single-markdown "reflection digest" from the Homebase folder, ready
// to paste into any AI chat. This is the data half of the AI integration: the
// primer teaches the agent *how* to read; the digest hands it *what* to read.
//
// Everything here is deliberately split into a pure assembler (`buildDigest`,
// takes files in, returns a string) and a thin filesystem wrapper
// (`gatherDigest`, reads the folder then calls the assembler). The pure half
// is unit-tested without any File System Access mocking.
//
// Privacy posture: the digest is assembled entirely in the browser and only
// ever reaches the clipboard. Nothing is sent anywhere — where it goes next is
// the user's choice (paste into Claude, ChatGPT, a local model, whatever).

import { listTopLevelFiles, readFile } from "../fs";

export interface CorpusFile {
  name: string;
  text: string;
}

export interface DigestOptions {
  /** "Today" — the window anchor. Injected so the assembler stays pure/testable. */
  now: Date;
  /** How many days back of daily entries to include (inclusive of today). */
  days: number;
}

// `YYYY-MM-DD.md` — the dated daily-entry log files.
const DAY_LOG_RE = /^(\d{4})-(\d{2})-(\d{2})\.md$/;

// Strategy files all carry a fixed name or a horizon prefix, so they never
// collide with the date-named logs. (`day-` is intentionally excluded: the
// daily logs already cover that horizon, and a `day-…` prefix would be
// ambiguous next to `YYYY-MM-DD.md`.)
const STRATEGY_NAMES = new Set(["values.md", "life-goals.md"]);
const STRATEGY_PREFIXES = ["year-", "month-", "week-"];

const MS_PER_DAY = 86_400_000;

/** True for a dated daily-entry file like `2026-06-09.md`. */
export function isDayLogFile(name: string): boolean {
  return DAY_LOG_RE.test(name);
}

/** True for a strategy file (`values.md`, `life-goals.md`, `year-…`, …). */
export function isStrategyFile(name: string): boolean {
  if (!name.endsWith(".md")) return false;
  if (STRATEGY_NAMES.has(name)) return true;
  return STRATEGY_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/** True for any file the digest cares about — used to avoid reading the rest. */
export function isCorpusFile(name: string): boolean {
  return isDayLogFile(name) || isStrategyFile(name);
}

/** Parse the date out of a day-log filename, or null if it isn't one. */
function dayLogDate(name: string): Date | null {
  const m = DAY_LOG_RE.exec(name);
  if (!m) return null;
  // Noon UTC dodges any daylight-saving / timezone boundary surprises when we
  // only care about whole-day differences.
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
}

/** Whole-day difference (a − b), ignoring time of day. */
function wholeDayDiff(a: Date, b: Date): number {
  const au = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bu = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((au - bu) / MS_PER_DAY);
}

/**
 * Assemble the digest markdown from a set of files. Pure: no filesystem, no
 * clock — pass `now` in. Empty files are skipped so the digest is signal, not
 * scaffolding. Returns a friendly note rather than an empty string when there's
 * nothing to include yet.
 */
export function buildDigest(files: CorpusFile[], opts: DigestOptions): string {
  const { now, days } = opts;

  const dayLogs = files
    .filter((f) => isDayLogFile(f.name) && f.text.trim().length > 0)
    .filter((f) => {
      const date = dayLogDate(f.name);
      if (!date) return false;
      const diff = wholeDayDiff(now, date);
      return diff >= 0 && diff < days;
    })
    // Newest first.
    .sort((a, b) => b.name.localeCompare(a.name));

  const strategy = files
    .filter((f) => isStrategyFile(f.name) && f.text.trim().length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const sections: string[] = [
    "# My Homebase reflection digest",
    `This is a snapshot of my own journaling and planning files (last ${days} days of daily entries, plus my strategy files). Read it as my private writing and help me reflect on it.`,
  ];

  if (strategy.length > 0) {
    sections.push("## Strategy");
    for (const f of strategy) {
      sections.push(`### ${f.name}\n\n${f.text.trim()}`);
    }
  }

  if (dayLogs.length > 0) {
    sections.push(`## Daily entries (last ${days} days)`);
    for (const f of dayLogs) {
      // Strip the `.md` for a cleaner date heading.
      const heading = f.name.replace(/\.md$/, "");
      sections.push(`### ${heading}\n\n${f.text.trim()}`);
    }
  }

  if (strategy.length === 0 && dayLogs.length === 0) {
    sections.push(
      "_No entries found yet. Write a few daily pages or fill in your values, then try again._",
    );
  }

  return `${sections.join("\n\n")}\n`;
}

/**
 * Read the relevant files from the Homebase folder and build the digest. Only
 * touches day-log and strategy files (skips everything else in the folder).
 */
export async function gatherDigest(opts?: { days?: number; now?: Date }): Promise<string> {
  const days = opts?.days ?? 30;
  const now = opts?.now ?? new Date();

  const names = (await listTopLevelFiles()).filter(isCorpusFile);
  const files: CorpusFile[] = await Promise.all(
    names.map(async (name) => ({ name, text: await readFile(name) })),
  );

  return buildDigest(files, { now, days });
}
