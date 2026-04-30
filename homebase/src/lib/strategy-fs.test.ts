// Tests for StrategyFs run against the in-memory fake. The fake matches
// production semantics exactly (the fake is the testable surface; the
// production path adds FSAccess + IDB plumbing tested by manual smoke
// during the first-run permission flow).

import { describe, expect, it } from "vite-plus/test";
import { createFakeStrategyFs } from "./strategy-fs";

describe("createFakeStrategyFs", () => {
  it("returns null for a missing file", async () => {
    const fs = createFakeStrategyFs();
    expect(await fs.read("month-2026-04.md")).toBeNull();
  });

  it("write then read roundtrips content verbatim", async () => {
    const fs = createFakeStrategyFs();
    await fs.write("year-2026.md", "# 2026\nGoals.");
    expect(await fs.read("year-2026.md")).toBe("# 2026\nGoals.");
  });

  it("write overwrites existing content", async () => {
    const fs = createFakeStrategyFs({ "values.md": "old" });
    await fs.write("values.md", "new");
    expect(await fs.read("values.md")).toBe("new");
  });

  it("exists reflects current state", async () => {
    const fs = createFakeStrategyFs({ "year-2026.md": "" });
    expect(await fs.exists("year-2026.md")).toBe(true);
    expect(await fs.exists("year-2025.md")).toBe(false);
    await fs.write("year-2025.md", "");
    expect(await fs.exists("year-2025.md")).toBe(true);
  });

  it("list filters by prefix", async () => {
    const fs = createFakeStrategyFs({
      "month-2026-04.md": "",
      "month-2026-03.md": "",
      "year-2026.md": "",
      "values.md": "",
    });
    expect(await fs.list("month-")).toEqual(["month-2026-04.md", "month-2026-03.md"]);
    expect(await fs.list("year-")).toEqual(["year-2026.md"]);
  });

  it("list returns names sorted lexicographically descending (most recent first)", async () => {
    const fs = createFakeStrategyFs({
      "month-2026-01.md": "",
      "month-2026-12.md": "",
      "month-2026-06.md": "",
      "month-2025-11.md": "",
    });
    expect(await fs.list("month-")).toEqual([
      "month-2026-12.md",
      "month-2026-06.md",
      "month-2026-01.md",
      "month-2025-11.md",
    ]);
  });

  it("list returns empty array when no files match the prefix", async () => {
    const fs = createFakeStrategyFs({ "values.md": "" });
    expect(await fs.list("month-")).toEqual([]);
  });

  it("init is a no-op for the fake (production needs it; fake doesn't)", async () => {
    const fs = createFakeStrategyFs();
    await expect(fs.init()).resolves.toBeUndefined();
  });

  it("seeded fake exposes initial files", async () => {
    const fs = createFakeStrategyFs({
      "values.md": "courage, curiosity, compassion",
      "year-2026.md": "ship Casr",
    });
    expect(await fs.read("values.md")).toBe("courage, curiosity, compassion");
    expect(await fs.read("year-2026.md")).toBe("ship Casr");
    expect(await fs.list("")).toEqual(["year-2026.md", "values.md"]);
  });
});
