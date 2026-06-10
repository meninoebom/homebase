import { describe, expect, it } from "vite-plus/test";
import { AI_PRIMER } from "./primer";

// These guard against the primer drifting away from the actual folder layout.
// If the file-naming convention changes, the digest code and this primer must
// change together — a failure here is the reminder.
describe("AI_PRIMER", () => {
  it("documents the day-log and strategy file conventions", () => {
    expect(AI_PRIMER).toContain("YYYY-MM-DD.md");
    expect(AI_PRIMER).toContain("values.md");
    expect(AI_PRIMER).toContain("life-goals.md");
    expect(AI_PRIMER).toContain("year-YYYY.md");
  });

  it("sets a direct, non-flattering reflective stance", () => {
    expect(AI_PRIMER.toLowerCase()).toContain("do not flatter");
    expect(AI_PRIMER.toLowerCase()).toContain("private writing");
  });
});
