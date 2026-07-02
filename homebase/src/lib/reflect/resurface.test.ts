import { describe, expect, it } from "vite-plus/test";
import { excerptOf, isDayLogFile, selectResurfacing, type PastEntry } from "./resurface";

// Anchor "today" so all the date math is deterministic. Local noon matches the
// module's own parsing convention.
const TODAY = new Date(2026, 5, 9, 12); // 2026-06-09

function entry(date: string, text: string): PastEntry {
  return { date, text };
}

// A day file as it actually lands on disk: a `# Date` title, a `## slot`
// header, then the prose. The selector must skip the scaffolding.
function dayFile(prose: string): string {
  return `# Tuesday, June 9, 2026\n\n## Morning pages\n\n${prose}\n`;
}

describe("isDayLogFile", () => {
  it("matches dated day files and rejects strategy files", () => {
    expect(isDayLogFile("2025-06-09.md")).toBe(true);
    expect(isDayLogFile("week-2026-W24.md")).toBe(false);
    expect(isDayLogFile("values.md")).toBe(false);
    expect(isDayLogFile("2025-06-09.txt")).toBe(false);
  });
});

describe("excerptOf", () => {
  it("returns the first prose line, skipping title and section headers", () => {
    expect(excerptOf(dayFile("The first real thing I wrote."))).toBe(
      "The first real thing I wrote.",
    );
  });

  it("returns empty string when there is only scaffolding", () => {
    expect(excerptOf("# Title\n\n## Section\n\n")).toBe("");
    expect(excerptOf("")).toBe("");
  });

  it("trims a long paragraph on a word boundary with an ellipsis", () => {
    const long = "word ".repeat(80).trim();
    const out = excerptOf(dayFile(long));
    expect(out.length).toBeLessThan(long.length);
    expect(out.endsWith("…")).toBe(true);
    // No half-sliced word before the ellipsis.
    expect(out).not.toMatch(/wor…$/);
  });
});

describe("selectResurfacing", () => {
  it("prefers one year ago today when that entry exists", () => {
    const entries = [
      entry("2025-06-09", dayFile("A year ago I was starting the garden.")),
      entry("2026-05-09", dayFile("A month ago thought.")),
      entry("2026-01-01", dayFile("New year note.")),
    ];
    const result = selectResurfacing(TODAY, entries);
    expect(result).not.toBeNull();
    expect(result?.date).toBe("2025-06-09");
    expect(result?.label).toBe("One year ago today");
    expect(result?.excerpt).toBe("A year ago I was starting the garden.");
  });

  it("falls back to same-day one month ago when there is no year-ago entry", () => {
    const entries = [
      entry("2026-05-09", dayFile("A month ago I felt stuck.")),
      entry("2026-01-01", dayFile("New year note.")),
    ];
    const result = selectResurfacing(TODAY, entries);
    expect(result?.date).toBe("2026-05-09");
    expect(result?.label).toBe("From May 2026");
    expect(result?.excerpt).toBe("A month ago I felt stuck.");
  });

  it("falls back to a deterministic seeded pick when neither anniversary exists", () => {
    const entries = [
      entry("2026-04-02", dayFile("April thought.")),
      entry("2026-03-15", dayFile("March thought.")),
      entry("2026-02-20", dayFile("February thought.")),
    ];
    const result = selectResurfacing(TODAY, entries);
    expect(result).not.toBeNull();
    // Must be one of the available entries, labelled by its month.
    expect(["2026-04-02", "2026-03-15", "2026-02-20"]).toContain(result?.date);
    expect(result?.label).toMatch(/^From \w+ 2026$/);
  });

  it("is stable across two calls on the same day", () => {
    const entries = [
      entry("2026-04-02", dayFile("April thought.")),
      entry("2026-03-15", dayFile("March thought.")),
      entry("2026-02-20", dayFile("February thought.")),
      entry("2026-01-10", dayFile("January thought.")),
    ];
    const a = selectResurfacing(TODAY, entries);
    const b = selectResurfacing(TODAY, entries);
    expect(a?.date).toBe(b?.date);
  });

  it("returns null when there is no usable history", () => {
    expect(selectResurfacing(TODAY, [])).toBeNull();
    // Future / today entries and scaffolding-only files are not usable.
    const entries = [
      entry("2026-06-09", dayFile("Today itself.")),
      entry("2026-07-01", dayFile("The future.")),
      entry("2026-05-01", "# Title\n\n## Section\n\n"),
    ];
    expect(selectResurfacing(TODAY, entries)).toBeNull();
  });

  it("never resurfaces today's own entry", () => {
    const entries = [
      entry("2026-06-09", dayFile("Today itself, should be skipped.")),
      entry("2026-05-09", dayFile("A month ago.")),
    ];
    const result = selectResurfacing(TODAY, entries);
    expect(result?.date).toBe("2026-05-09");
  });

  it("labels a multi-year anniversary with the year count", () => {
    const entries = [entry("2024-06-09", dayFile("Two years back."))];
    const result = selectResurfacing(TODAY, entries);
    expect(result?.label).toBe("2 years ago today");
  });
});
