import { describe, expect, it } from "vite-plus/test";
import { CarryOverResolver } from "./carry-over-resolver";
import { createFakeStrategyFs } from "./strategy-fs";

describe("CarryOverResolver.resolve", () => {
  it("returns null when no prior files exist (very first entry)", async () => {
    const fs = createFakeStrategyFs();
    expect(await CarryOverResolver.resolve(fs, "month", "2026-04")).toBeNull();
    expect(await CarryOverResolver.resolve(fs, "year", "2026")).toBeNull();
    expect(await CarryOverResolver.resolve(fs, "week", "2026-W17")).toBeNull();
  });

  it("returns prior period's content when the immediate prior exists", async () => {
    const fs = createFakeStrategyFs({
      "month-2026-03.md": "March goals.",
    });
    const result = await CarryOverResolver.resolve(fs, "month", "2026-04");
    expect(result).toEqual({ content: "March goals.", sourcePeriod: "2026-03" });
  });

  it("falls back to the most recent existing file when there's a gap", async () => {
    // April was skipped — May expands and should pull from March.
    const fs = createFakeStrategyFs({
      "month-2026-03.md": "March goals.",
      "month-2026-01.md": "January goals.",
    });
    const result = await CarryOverResolver.resolve(fs, "month", "2026-05");
    expect(result).toEqual({ content: "March goals.", sourcePeriod: "2026-03" });
  });

  it("does not pull from a file at or after the target period", async () => {
    // Future-dated files (somehow created) shouldn't leak backwards.
    const fs = createFakeStrategyFs({
      "month-2026-05.md": "May (already exists, irrelevant).",
      "month-2026-06.md": "June (future-ish).",
    });
    const result = await CarryOverResolver.resolve(fs, "month", "2026-04");
    expect(result).toBeNull();
  });

  it("handles year-rollover for week horizon", async () => {
    // Prior of 2026-W01 is 2025-W52 (52-week year).
    const fs = createFakeStrategyFs({
      "week-2025-W52.md": "Last week of 2025.",
    });
    const result = await CarryOverResolver.resolve(fs, "week", "2026-W01");
    expect(result).toEqual({ content: "Last week of 2025.", sourcePeriod: "2025-W52" });
  });

  it("handles year-rollover for month horizon (Jan → prior Dec)", async () => {
    const fs = createFakeStrategyFs({
      "month-2025-12.md": "December.",
    });
    const result = await CarryOverResolver.resolve(fs, "month", "2026-01");
    expect(result).toEqual({ content: "December.", sourcePeriod: "2025-12" });
  });

  it("handles year horizon decrement", async () => {
    const fs = createFakeStrategyFs({
      "year-2025.md": "2025 plan.",
    });
    const result = await CarryOverResolver.resolve(fs, "year", "2026");
    expect(result).toEqual({ content: "2025 plan.", sourcePeriod: "2025" });
  });

  it("returns content from prior even when other unrelated files exist", async () => {
    const fs = createFakeStrategyFs({
      "values.md": "courage, curiosity",
      "life-goals.md": "ship Casr",
      "year-2026.md": "2026.",
      "month-2026-03.md": "March.",
    });
    const result = await CarryOverResolver.resolve(fs, "month", "2026-04");
    expect(result?.content).toBe("March.");
  });

  it("throws for persistent horizons (no period to roll back from)", async () => {
    const fs = createFakeStrategyFs();
    await expect(CarryOverResolver.resolve(fs, "life-values", "anything")).rejects.toThrow();
    await expect(CarryOverResolver.resolve(fs, "life-goals", "anything")).rejects.toThrow();
  });

  it("returns the prior even when content is empty string (file exists, empty body)", async () => {
    const fs = createFakeStrategyFs({
      "month-2026-03.md": "",
    });
    const result = await CarryOverResolver.resolve(fs, "month", "2026-04");
    expect(result).toEqual({ content: "", sourcePeriod: "2026-03" });
  });
});
