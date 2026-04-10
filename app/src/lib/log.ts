// Thin TypeScript wrappers around the Rust log commands in src-tauri/src/commands/log.rs.
//
// We're not using tauri-specta yet — the command surface is small enough (three
// commands) that hand-written bindings are clearer and save a generated file
// from the build loop. If the surface grows past ~6 commands or anything gains
// non-trivial types, migrate to tauri-specta as a cleanup pass.
//
// The contract these wrappers document:
// - readDay(date) returns "" for a day that hasn't been written yet
// - appendSection writes under a "## <slot>" header, creates the day file with
//   a "# <human date>" header on first write
// - grepLogs takes a list of ISO dates (the frontend computes "last N days")
//   and returns at most one hit per file

import { invoke } from "@tauri-apps/api/core";

export interface LogHit {
  date: string;
  line: string;
  section: string | null;
}

/**
 * Read the full markdown text for a single day. Returns "" if the file
 * doesn't exist — an empty day is a valid state, not an error.
 */
export async function readDay(date: string): Promise<string> {
  return invoke<string>("read_day", { date });
}

/**
 * Atomically append a `## <slot>` section with body text to the day's log.
 * Creates the day file with a `# <human date>` header on first write.
 */
export async function appendSection(date: string, slot: string, body: string): Promise<void> {
  await invoke("append_section", { date, slot, body });
}

/**
 * Search the given dates for the first line matching `pattern` in each file.
 * The frontend chooses the dates (typically the last 14), so Rust never has
 * to reason about "what day is 14 days ago."
 */
export async function grepLogs(pattern: string, dates: string[]): Promise<LogHit[]> {
  return invoke<LogHit[]>("grep_logs", { pattern, dates });
}

/**
 * Local today as YYYY-MM-DD, using the browser/webview's timezone. The
 * morning ritual is a single-user app in a single timezone, so this is
 * simpler than pulling chrono into Rust for the same result.
 */
export function todayISO(): string {
  return localDateISO(new Date());
}

/**
 * Format a Date as YYYY-MM-DD in the local timezone. Split out from todayISO
 * so the same formatter can build the "last N days" list for grepLogs.
 */
export function localDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * The list of ISO dates from today going back `days` days, inclusive.
 * Today is index 0, yesterday is index 1, etc. Used to build the whisper
 * search window — typically `recentDates(14)`.
 */
export function recentDates(days: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(localDateISO(d));
  }
  return out;
}
