// "From your own pages" — resurface a past daily entry so the journal quietly
// talks back with the user's own words. This is the cheapest, fully-offline,
// zero-AI way to make "a journal that talks back" true today: no model, no
// network, just the entries already on disk (the same idea as Day One's
// "On this day").
//
// Following the digest.ts pattern, this splits into a pure selector
// (`selectResurfacing`, takes entries in, returns a pick) and a thin
// filesystem wrapper (`gatherResurfacing`, reads the folder then selects).
// The pure half is unit-tested without any File System Access mocking.

import { listTopLevelFiles, readFile } from "../fs";
import { localDateISO } from "../log";

// `YYYY-MM-DD.md` — the dated daily-entry log files (same shape as digest.ts).
const DAY_LOG_RE = /^(\d{4})-(\d{2})-(\d{2})\.md$/;

// How long an excerpt can run before we trim it. Long enough for a full
// thought, short enough to stay a quiet aside rather than a second headline.
const MAX_EXCERPT = 220;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface PastEntry {
  /** ISO date `YYYY-MM-DD` of the day file. */
  date: string;
  /** Raw markdown body of the day file. */
  text: string;
}

export interface Resurfaced {
  /** ISO date of the chosen past entry. */
  date: string;
  /** First meaningful paragraph, trimmed to a sane length. */
  excerpt: string;
  /** Relative-age label, e.g. "One year ago today" or "From April 2026". */
  label: string;
}

/** True for a dated daily-entry file like `2026-06-09.md`. */
export function isDayLogFile(name: string): boolean {
  return DAY_LOG_RE.test(name);
}

/** Parse an ISO `YYYY-MM-DD` date into local-noon Date, or null if malformed. */
function parseISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  // Local noon dodges any DST / timezone boundary surprise: we only ever care
  // about whole calendar days, and the callers build ISO keys with local dates.
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
}

/**
 * Pull the first meaningful paragraph out of a day file's markdown and trim it
 * to a readable length. Skips the `# Date` title, `## slot` section headers,
 * and blank lines — the first prose line the user actually wrote is what we
 * want. Returns "" when there's nothing but scaffolding.
 */
export function excerptOf(text: string): string {
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.length === 0) continue;
    if (line.startsWith("#")) continue; // `#` title and `##` section headers
    if (line.length <= MAX_EXCERPT) return line;
    // Trim on a word boundary so we don't slice a word in half.
    const cut = line.slice(0, MAX_EXCERPT);
    const lastSpace = cut.lastIndexOf(" ");
    const head = lastSpace > MAX_EXCERPT * 0.6 ? cut.slice(0, lastSpace) : cut;
    return `${head.trimEnd()}…`;
  }
  return "";
}

/** Build the relative-age label for a past entry given today's date. */
function labelFor(today: Date, entry: Date): string {
  const sameMonthDay = today.getMonth() === entry.getMonth() && today.getDate() === entry.getDate();
  const yearsBack = today.getFullYear() - entry.getFullYear();

  if (sameMonthDay && yearsBack === 1) return "One year ago today";
  if (sameMonthDay && yearsBack > 1) return `${yearsBack} years ago today`;

  // Not an anniversary: name the month it came from, e.g. "From April 2026".
  return `From ${MONTH_NAMES[entry.getMonth()]} ${entry.getFullYear()}`;
}

/**
 * Stable non-negative hash of a string. Same seed → same value across reloads,
 * so a date-seeded pick is stable for the whole day (matching the once-per-day
 * briefing rhythm). Mirrors the stableHash used by the day page's briefing.
 */
function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Choose a past entry to resurface. Pure: no filesystem, no clock — pass
 * `today` and the available entries in.
 *
 * Selection priority:
 *   1. One year ago today, if an entry exists for that exact date.
 *   2. Same day-of-month one month ago, if an entry exists there.
 *   3. A deterministic pick over all remaining past entries, seeded by today's
 *      date so it's stable across reloads within the same day.
 *
 * Entries with no meaningful prose (only headers/blank lines) are ignored, and
 * today's own entry is never resurfaced. Returns null when there's no usable
 * history (brand-new users).
 */
export function selectResurfacing(today: Date, entries: PastEntry[]): Resurfaced | null {
  const todayISO = localDateISO(today);

  // Index usable entries by date: strictly in the past, with real prose.
  const byDate = new Map<string, PastEntry>();
  for (const entry of entries) {
    if (entry.date >= todayISO) continue; // never today or the future
    if (excerptOf(entry.text).length === 0) continue; // scaffolding only
    byDate.set(entry.date, entry);
  }
  if (byDate.size === 0) return null;

  const pick = (date: string): Resurfaced | null => {
    const entry = byDate.get(date);
    if (!entry) return null;
    const when = parseISO(entry.date);
    if (!when) return null;
    return { date: entry.date, excerpt: excerptOf(entry.text), label: labelFor(today, when) };
  };

  // 1. One year ago today.
  const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate(), 12);
  const yearAgoPick = pick(localDateISO(yearAgo));
  if (yearAgoPick) return yearAgoPick;

  // 2. Same day-of-month one month ago. new Date() normalizes overflow (e.g.
  //    Mar 31 minus a month lands in early Mar), which is acceptable: we only
  //    resurface if an actual entry exists on the resulting date.
  const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate(), 12);
  const monthAgoPick = pick(localDateISO(monthAgo));
  if (monthAgoPick) return monthAgoPick;

  // 3. Deterministic seeded pick over the rest. Sort for a stable index space,
  //    then seed by today's date so the choice holds all day but rotates daily.
  const dates = [...byDate.keys()].sort();
  const idx = stableHash(todayISO) % dates.length;
  return pick(dates[idx]);
}

/**
 * Read the day-log files from the Homebase folder and select one to resurface.
 * Only touches dated day-log files (skips strategy files and everything else).
 * Returns null on no usable history.
 */
export async function gatherResurfacing(now: Date = new Date()): Promise<Resurfaced | null> {
  const names = (await listTopLevelFiles()).filter(isDayLogFile);
  const entries: PastEntry[] = await Promise.all(
    names.map(async (name) => ({ date: name.replace(/\.md$/, ""), text: await readFile(name) })),
  );
  return selectResurfacing(now, entries);
}
