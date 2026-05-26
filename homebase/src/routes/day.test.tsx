// Footer status-text logic for the day page. The route component itself isn't
// rendered (router convention); saveFooterText is the pure, exported seam.

import { describe, expect, it } from "vite-plus/test";
import { saveFooterText } from "./day";

describe("saveFooterText", () => {
  it("shows 'saving…' while a save is in flight", () => {
    expect(saveFooterText(true, false, "saved 9:14 am")).toBe("saving…");
  });

  it("shows an error instead of a stale 'saved' label when the save failed", () => {
    expect(saveFooterText(false, true, "saved 9:14 am")).toMatch(/couldn.t save/i);
  });

  it("shows the saved label when idle and healthy", () => {
    expect(saveFooterText(false, false, "saved 9:14 am")).toBe("saved 9:14 am");
  });

  it("'saving…' takes precedence over a prior error during a retry", () => {
    expect(saveFooterText(true, true, "")).toBe("saving…");
  });
});
