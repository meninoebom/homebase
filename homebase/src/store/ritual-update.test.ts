// Tests for the updateConfig action and the related slot-mutation flows
// the settings page exercises (reorder / add / remove). Kept separate
// from ritual.test.ts because these tests don't need the full
// loadToday-style mocking — they seed config directly.

import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
import type { HomebaseConfig } from "../lib/config";

let mockWriteConfig: (c: HomebaseConfig) => Promise<void>;

vi.mock("../lib/config", async () => {
  const actual = await vi.importActual<typeof import("../lib/config")>("../lib/config");
  return {
    ...actual,
    readConfig: () => Promise.resolve({ kind: "missing" as const }),
    writeConfig: (c: HomebaseConfig) => mockWriteConfig(c),
  };
});

vi.mock("../lib/fs", () => ({
  listTopLevelFiles: () => Promise.resolve([]),
}));

vi.mock("../lib/log", () => ({
  readDaySections: () => Promise.resolve({}),
  saveDay: () => Promise.resolve(),
  todayISO: () => "2026-05-08",
}));

const { useRitualStore } = await import("./ritual");
const { defaultConfig } = await import("../lib/config");

beforeEach(() => {
  mockWriteConfig = () => Promise.resolve();
  useRitualStore.setState({
    drafts: {},
    config: defaultConfig(),
    configError: null,
    loaded: true,
    saving: false,
    lastSavedAt: null,
  });
});

describe("updateConfig", () => {
  it("applies the updater and persists", async () => {
    const writes: HomebaseConfig[] = [];
    mockWriteConfig = (c) => {
      writes.push(c);
      return Promise.resolve();
    };

    await useRitualStore.getState().updateConfig((c) => ({ ...c, slots: c.slots.slice(0, 2) }));

    expect(useRitualStore.getState().config?.slots).toHaveLength(2);
    expect(writes).toHaveLength(1);
    expect(writes[0].slots).toHaveLength(2);
  });

  it("does not write when the updater returns the same reference", async () => {
    let wrote = false;
    mockWriteConfig = () => {
      wrote = true;
      return Promise.resolve();
    };

    await useRitualStore.getState().updateConfig((c) => c);

    expect(wrote).toBe(false);
  });

  it("is a no-op when there is no config (e.g. error state)", async () => {
    useRitualStore.setState({ config: null });
    let called = false;
    await useRitualStore.getState().updateConfig(() => {
      called = true;
      return defaultConfig();
    });
    expect(called).toBe(false);
  });
});

describe("slot mutations through updateConfig", () => {
  it("supports reorder", async () => {
    const original = useRitualStore.getState().config!;
    const newOrder = [...original.slots].reverse();

    await useRitualStore.getState().updateConfig((c) => ({ ...c, slots: newOrder }));

    expect(useRitualStore.getState().config?.slots.map((s) => s.id)).toEqual(
      newOrder.map((s) => s.id),
    );
  });

  it("supports add", async () => {
    await useRitualStore.getState().updateConfig((c) => ({
      ...c,
      slots: [...c.slots, { id: "added", kind: "prompt", prompt: "test" }],
    }));

    const ids = useRitualStore.getState().config?.slots.map((s) => s.id);
    expect(ids).toContain("added");
  });

  it("supports remove", async () => {
    await useRitualStore
      .getState()
      .updateConfig((c) => ({ ...c, slots: c.slots.filter((s) => s.id !== "dreams") }));

    const ids = useRitualStore.getState().config?.slots.map((s) => s.id);
    expect(ids).not.toContain("dreams");
  });
});
