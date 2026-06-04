import { beforeEach, describe, expect, it } from "vite-plus/test";
import { dismissWelcome, isWelcomePending, markWelcomePending } from "./welcome";

describe("welcome flag", () => {
  beforeEach(() => localStorage.clear());

  it("is not pending by default", () => {
    expect(isWelcomePending()).toBe(false);
  });

  it("is pending after a genuine first-run grant", () => {
    markWelcomePending();
    expect(isWelcomePending()).toBe(true);
  });

  it("stops being pending once dismissed", () => {
    markWelcomePending();
    dismissWelcome();
    expect(isWelcomePending()).toBe(false);
  });

  it("a dismissed welcome never returns (returning user sees nothing)", () => {
    markWelcomePending();
    dismissWelcome();
    // A later read — e.g. on a reload — must still report not-pending.
    expect(isWelcomePending()).toBe(false);
  });
});
