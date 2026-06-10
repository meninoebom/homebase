import { describe, expect, it } from "vite-plus/test";
import { buildDigest, isCorpusFile, isDayLogFile, isStrategyFile } from "./digest";

// Anchor "today" so the window math is deterministic.
const NOW = new Date(Date.UTC(2026, 5, 9, 12)); // 2026-06-09

describe("isDayLogFile", () => {
  it("matches dated daily-entry files", () => {
    expect(isDayLogFile("2026-06-09.md")).toBe(true);
    expect(isDayLogFile("1999-01-01.md")).toBe(true);
  });

  it("rejects strategy files and non-day names", () => {
    expect(isDayLogFile("values.md")).toBe(false);
    expect(isDayLogFile("year-2026.md")).toBe(false);
    expect(isDayLogFile("2026-06-09.txt")).toBe(false);
    expect(isDayLogFile("notes.md")).toBe(false);
  });
});

describe("isStrategyFile", () => {
  it("matches fixed-name and horizon-prefixed strategy files", () => {
    expect(isStrategyFile("values.md")).toBe(true);
    expect(isStrategyFile("life-goals.md")).toBe(true);
    expect(isStrategyFile("year-2026.md")).toBe(true);
    expect(isStrategyFile("month-2026-06.md")).toBe(true);
    expect(isStrategyFile("week-2026-W24.md")).toBe(true);
  });

  it("rejects day logs and unrelated files", () => {
    expect(isStrategyFile("2026-06-09.md")).toBe(false);
    expect(isStrategyFile("homebase.config.json")).toBe(false);
    expect(isStrategyFile("values.txt")).toBe(false);
  });
});

describe("isCorpusFile", () => {
  it("is the union of day logs and strategy files", () => {
    expect(isCorpusFile("2026-06-09.md")).toBe(true);
    expect(isCorpusFile("values.md")).toBe(true);
    expect(isCorpusFile("homebase.config.json")).toBe(false);
  });
});

describe("buildDigest", () => {
  it("includes recent daily entries newest-first and the strategy files", () => {
    const out = buildDigest(
      [
        { name: "values.md", text: "Be present." },
        { name: "year-2026.md", text: "Ship Homebase." },
        { name: "2026-06-09.md", text: "Today I wrote." },
        { name: "2026-06-07.md", text: "Two days ago." },
      ],
      { now: NOW, days: 30 },
    );

    expect(out).toContain("## Strategy");
    expect(out).toContain("### values.md");
    expect(out).toContain("Be present.");
    expect(out).toContain("## Daily entries (last 30 days)");
    // Newest first: 06-09 must appear before 06-07.
    expect(out.indexOf("### 2026-06-09")).toBeLessThan(out.indexOf("### 2026-06-07"));
    // Day headings drop the .md extension.
    expect(out).not.toContain("2026-06-09.md");
  });

  it("excludes daily entries older than the window", () => {
    const out = buildDigest(
      [
        { name: "2026-06-09.md", text: "in window" },
        { name: "2026-04-01.md", text: "too old" },
      ],
      { now: NOW, days: 30 },
    );

    expect(out).toContain("in window");
    expect(out).not.toContain("too old");
  });

  it("skips empty files so the digest is signal, not scaffolding", () => {
    const out = buildDigest(
      [
        { name: "values.md", text: "   \n  " },
        { name: "2026-06-09.md", text: "" },
      ],
      { now: NOW, days: 30 },
    );

    expect(out).not.toContain("### values.md");
    expect(out).not.toContain("## Daily entries");
    expect(out).toContain("No entries found yet");
  });

  it("includes today (zero-day diff) and the last day of the window", () => {
    const out = buildDigest(
      [
        { name: "2026-06-09.md", text: "today" }, // diff 0
        { name: "2026-05-11.md", text: "edge in" }, // diff 29, inside days=30
        { name: "2026-05-10.md", text: "edge out" }, // diff 30, outside
      ],
      { now: NOW, days: 30 },
    );

    expect(out).toContain("today");
    expect(out).toContain("edge in");
    expect(out).not.toContain("edge out");
  });
});
