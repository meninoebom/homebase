// Log file operations — the browser-native replacement for the former Rust
// commands. Same external contract as the old Tauri-backed log.ts so slot
// components did not need to change.
//
// Files live under the FileSystemDirectoryHandle the user picked once on
// first run (see fs.ts). Layout inside that directory is identical to the
// Tauri version:
//   <log-dir>/YYYY-MM-DD.md         — day logs
//   <log-dir>/<slot>/state.md       — workspace slot state
//
// Preserves §15 rule 4 (grep is the memory layer): the files are real
// plaintext on disk, greppable from Terminal, and survive the app.

import { readFile, readNested, writeFile, writeNested } from "./fs";

export interface LogHit {
  date: string;
  line: string;
  section: string | null;
}

export interface DaySection {
  slot: string;
  body: string;
}

export async function readDay(date: string): Promise<string> {
  validateDate(date);
  return readFile(`${date}.md`);
}

export async function readState(slot: string): Promise<string> {
  validateSlot(slot);
  return readNested([slot, "state.md"]);
}

export async function writeState(slot: string, text: string): Promise<void> {
  validateSlot(slot);
  await writeNested([slot, "state.md"], text);
}

export async function appendSection(date: string, slot: string, body: string): Promise<void> {
  validateDate(date);
  validateSlot(slot);
  const existing = await readDay(date);
  const first = existing.length === 0;
  const parts: string[] = [];
  if (first) {
    parts.push(`# ${humanDate(date)}`, "");
  } else {
    parts.push(existing.trimEnd(), "");
  }
  parts.push(`## ${slot}`, "", body.trimEnd(), "");
  await writeFile(`${date}.md`, parts.join("\n"));
}

/**
 * Write the full day file, preserving any pre-existing sections whose
 * slots aren't in the new list. Mirrors save_day_impl from the old Rust
 * backend.
 */
export async function saveDay(date: string, sections: DaySection[]): Promise<void> {
  validateDate(date);
  sections.forEach((s) => validateSlot(s.slot));

  const existing = await readDay(date);
  const existingSections = parseSections(existing);
  const newSlotNames = new Set(sections.map((s) => s.slot));

  let output = `# ${humanDate(date)}\n\n`;

  for (const [slot, body] of existingSections) {
    if (!newSlotNames.has(slot)) {
      output += `## ${slot}\n\n${body.trim()}\n\n`;
    }
  }

  for (const s of sections) {
    if (s.body.trim().length > 0) {
      output += `## ${s.slot}\n\n${s.body.trimEnd()}\n\n`;
    }
  }

  await writeFile(`${date}.md`, output.trimEnd() + "\n");
}

export async function readDaySections(date: string): Promise<Record<string, string>> {
  const md = await readDay(date);
  const out: Record<string, string> = {};
  for (const [slot, body] of parseSections(md)) {
    out[slot] = body.trim();
  }
  return out;
}

export async function grepLogs(pattern: string, dates: string[]): Promise<LogHit[]> {
  if (pattern.length === 0) throw new Error("empty pattern");
  const hits: LogHit[] = [];
  for (const date of dates) {
    validateDate(date);
    const content = await readDay(date);
    if (!content) continue;
    const hit = firstMatch(content, pattern, date);
    if (hit) hits.push(hit);
  }
  return hits;
}

export function todayISO(): string {
  return localDateISO(new Date());
}

export function localDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

// -- helpers ------------------------------------------------------------

function validateDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`bad date: ${date}`);
  }
}

function validateSlot(slot: string): void {
  if (!slot || slot.includes("/") || slot.includes("\\") || slot.includes("\n")) {
    throw new Error(`bad slot name: ${slot}`);
  }
}

function parseSections(md: string): Array<[string, string]> {
  const sections: Array<[string, string]> = [];
  let current: string | null = null;
  let body: string[] = [];
  for (const line of md.split("\n")) {
    if (line.startsWith("## ")) {
      if (current !== null) sections.push([current, body.join("\n")]);
      current = line.slice(3).trim();
      body = [];
    } else if (line.startsWith("# ")) {
      // day header — skip
    } else if (current !== null) {
      body.push(line);
    }
  }
  if (current !== null) sections.push([current, body.join("\n")]);
  return sections;
}

function firstMatch(content: string, pattern: string, date: string): LogHit | null {
  let section: string | null = null;
  for (const line of content.split("\n")) {
    if (line.startsWith("## ")) {
      section = line.slice(3).trim();
      continue;
    }
    if (line.includes(pattern)) {
      return { date, line: line.trim(), section };
    }
  }
  return null;
}

function humanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
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
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const date = new Date(y, m - 1, d);
  return `${weekdays[date.getDay()]}, ${months[m - 1]} ${d}, ${y}`;
}
