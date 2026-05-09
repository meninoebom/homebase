import { describe, expect, it } from "vite-plus/test";
import { makeNewSlot } from "./settings";
import { defaultConfig, type HomebaseConfig } from "../lib/config";

describe("makeNewSlot", () => {
  it("generates prompt-1 in a config with no prompt-N slots", () => {
    const slot = makeNewSlot("prompt", defaultConfig());
    expect(slot.id).toBe("prompt-1");
    expect(slot.kind).toBe("prompt");
  });

  it("skips taken numbers when generating ids", () => {
    const config: HomebaseConfig = {
      ...defaultConfig(),
      slots: [
        { id: "prompt-1", kind: "prompt", prompt: "a" },
        { id: "prompt-2", kind: "prompt", prompt: "b" },
        { id: "prompt-4", kind: "prompt", prompt: "c" },
      ],
    };
    expect(makeNewSlot("prompt", config).id).toBe("prompt-3");
  });

  it("generates workspace-1 for the first workspace add", () => {
    const slot = makeNewSlot("workspace", defaultConfig());
    expect(slot.id).toBe("workspace-1");
    expect(slot.kind).toBe("workspace");
  });

  it("returns a valid SlotConfig with required fields populated", () => {
    const prompt = makeNewSlot("prompt", defaultConfig());
    if (prompt.kind === "prompt") {
      expect(prompt.prompt.length).toBeGreaterThan(0);
    }
    const workspace = makeNewSlot("workspace", defaultConfig());
    if (workspace.kind === "workspace") {
      expect(workspace.title.length).toBeGreaterThan(0);
    }
  });
});
