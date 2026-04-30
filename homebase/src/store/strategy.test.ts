// StrategyStore tests — exercised via the factory bound to an in-memory
// fake StrategyFs. We never hit the production singleton in tests because
// it's bound to FSAccess which doesn't exist in jsdom.

import { describe, expect, it } from "vite-plus/test";
import { createFakeStrategyFs } from "../lib/strategy-fs";
import { createStrategyStore } from "./strategy";

describe("StrategyStore", () => {
  it("seeds all six horizons with idle defaults on init", () => {
    const store = createStrategyStore(createFakeStrategyFs());
    const { rows } = store.getState();
    for (const h of ["life-values", "life-goals", "year", "month", "week"] as const) {
      expect(rows[h]).toMatchObject({
        expanded: false,
        content: "",
        carryOver: null,
        saveStatus: "idle",
        dirty: false,
        loaded: false,
      });
    }
  });

  it("expandRow loads the file content when the file exists", async () => {
    const store = createStrategyStore(createFakeStrategyFs({ "values.md": "courage, curiosity" }));
    await store.getState().expandRow("life-values");
    const row = store.getState().rows["life-values"];
    expect(row.content).toBe("courage, curiosity");
    expect(row.expanded).toBe(true);
    expect(row.loaded).toBe(true);
    expect(row.carryOver).toBeNull();
    expect(row.dirty).toBe(false);
  });

  it("expandRow on time-bound horizon with no current file pulls carry-over", async () => {
    // Find what the prior period of the current month is, so we can seed it.
    // Easier: pre-seed any prior month so the resolver's gap-fallback finds it.
    const store = createStrategyStore(createFakeStrategyFs({ "month-2020-01.md": "ancient" }));
    await store.getState().expandRow("month");
    const row = store.getState().rows["month"];
    expect(row.content).toBe("ancient");
    expect(row.carryOver).toEqual({ content: "ancient", sourcePeriod: "2020-01" });
    expect(row.dirty).toBe(true); // carrying content counts as a buffer to save
  });

  it("expandRow on time-bound horizon with no history at all leaves empty + no banner", async () => {
    const store = createStrategyStore(createFakeStrategyFs());
    await store.getState().expandRow("year");
    const row = store.getState().rows.year;
    expect(row.content).toBe("");
    expect(row.carryOver).toBeNull();
    expect(row.dirty).toBe(false);
  });

  it("expandRow re-expand without changes does not re-fetch (loaded short-circuit)", async () => {
    const fs = createFakeStrategyFs({ "values.md": "v1" });
    const store = createStrategyStore(fs);
    await store.getState().expandRow("life-values");
    // Mutate the underlying file; if expandRow re-reads, content would change.
    await fs.write("values.md", "v2");
    store.getState().collapseRow("life-values");
    await store.getState().expandRow("life-values");
    expect(store.getState().rows["life-values"].content).toBe("v1");
  });

  it("setContent updates content, marks dirty, dismisses carry-over banner", async () => {
    const store = createStrategyStore(createFakeStrategyFs({ "month-2020-01.md": "ancient" }));
    await store.getState().expandRow("month");
    expect(store.getState().rows.month.carryOver).not.toBeNull();
    store.getState().setContent("month", "edited");
    const row = store.getState().rows.month;
    expect(row.content).toBe("edited");
    expect(row.dirty).toBe(true);
    expect(row.carryOver).toBeNull();
  });

  it("clearCarryOver empties content + dismisses banner + resets loaded for re-trigger", async () => {
    const store = createStrategyStore(createFakeStrategyFs({ "month-2020-01.md": "ancient" }));
    await store.getState().expandRow("month");
    expect(store.getState().rows.month.carryOver).not.toBeNull();

    store.getState().clearCarryOver("month");
    let row = store.getState().rows.month;
    expect(row.content).toBe("");
    expect(row.carryOver).toBeNull();
    expect(row.loaded).toBe(false);

    // Re-trigger by re-expanding: resolver should re-pull the same carry-over.
    await store.getState().expandRow("month");
    row = store.getState().rows.month;
    expect(row.content).toBe("ancient");
    expect(row.carryOver).toEqual({ content: "ancient", sourcePeriod: "2020-01" });
  });

  it("flush writes content to fs, transitions saveStatus, clears dirty", async () => {
    const fs = createFakeStrategyFs();
    const store = createStrategyStore(fs);
    await store.getState().expandRow("life-values");
    store.getState().setContent("life-values", "courage");
    expect(store.getState().rows["life-values"].dirty).toBe(true);

    await store.getState().flush("life-values");

    expect(await fs.read("values.md")).toBe("courage");
    const row = store.getState().rows["life-values"];
    expect(row.dirty).toBe(false);
    expect(row.saveStatus).toBe("saved");
  });

  it("flush is a no-op when not dirty", async () => {
    const fs = createFakeStrategyFs();
    const store = createStrategyStore(fs);
    await store.getState().expandRow("life-values");

    await store.getState().flush("life-values");
    expect(await fs.exists("values.md")).toBe(false);
    expect(store.getState().rows["life-values"].saveStatus).toBe("idle");
  });

  it("resetSaveStatus brings saveStatus back to idle (consumer-driven settle)", async () => {
    const fs = createFakeStrategyFs();
    const store = createStrategyStore(fs);
    await store.getState().expandRow("life-values");
    store.getState().setContent("life-values", "x");
    await store.getState().flush("life-values");
    expect(store.getState().rows["life-values"].saveStatus).toBe("saved");

    store.getState().resetSaveStatus("life-values");
    expect(store.getState().rows["life-values"].saveStatus).toBe("idle");
  });
});
