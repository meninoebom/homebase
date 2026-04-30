// PeriodKey — tests for the date/period semantics module.
//
// The cases below are exhaustive on the boundary conditions that are easy
// to silently get wrong: ISO week 1 ↔ prior year W52/W53, January ↔ prior
// December, week 53 in long years (2020, 2026), Monday start.
//
// Tests do not freeze "now" — current() is stamped against a fixed clock
// inside each test using the optional `now` parameter, which keeps the
// public surface clean while making time-of-test independence trivial.

import { describe, expect, it } from "vite-plus/test";
import { PeriodKey } from "./period-key";

describe("PeriodKey.current", () => {
  it("returns null for persistent horizons", () => {
    expect(PeriodKey.current("life-values")).toBeNull();
    expect(PeriodKey.current("life-goals")).toBeNull();
  });

  it("returns YYYY for year", () => {
    const now = new Date("2026-04-30T12:00:00Z");
    expect(PeriodKey.current("year", now)).toBe("2026");
  });

  it("returns YYYY-MM for month with zero-padded month", () => {
    const aprilMid = new Date("2026-04-15T12:00:00Z");
    expect(PeriodKey.current("month", aprilMid)).toBe("2026-04");

    const januaryMid = new Date("2026-01-15T12:00:00Z");
    expect(PeriodKey.current("month", januaryMid)).toBe("2026-01");

    const decemberMid = new Date("2026-12-15T12:00:00Z");
    expect(PeriodKey.current("month", decemberMid)).toBe("2026-12");
  });

  it("returns YYYY-Www for week with zero-padded week (ISO 8601, Monday start)", () => {
    // Monday April 27, 2026 = ISO week 18, 2026
    const monday = new Date("2026-04-27T12:00:00Z");
    expect(PeriodKey.current("week", monday)).toBe("2026-W18");

    // Sunday April 26, 2026 = still ISO week 17, 2026 (week ends Sunday)
    const sunday = new Date("2026-04-26T12:00:00Z");
    expect(PeriodKey.current("week", sunday)).toBe("2026-W17");
  });

  it("handles ISO year boundary correctly (week 1 may belong to next calendar year)", () => {
    // Dec 29, 2025 (Monday) is in ISO week 1 of 2026 — because ISO week 1
    // contains the first Thursday, and Jan 1 2026 is Thursday.
    const dec29_2025 = new Date("2025-12-29T12:00:00Z");
    expect(PeriodKey.current("week", dec29_2025)).toBe("2026-W01");
  });
});

describe("PeriodKey.prior", () => {
  it("subtracts one for year", () => {
    expect(PeriodKey.prior("year", "2026")).toBe("2025");
    expect(PeriodKey.prior("year", "2000")).toBe("1999");
  });

  it("subtracts one for month within a year", () => {
    expect(PeriodKey.prior("month", "2026-04")).toBe("2026-03");
    expect(PeriodKey.prior("month", "2026-12")).toBe("2026-11");
  });

  it("rolls month back across year boundary", () => {
    expect(PeriodKey.prior("month", "2026-01")).toBe("2025-12");
    expect(PeriodKey.prior("month", "2000-01")).toBe("1999-12");
  });

  it("subtracts one for week within an ISO year", () => {
    expect(PeriodKey.prior("week", "2026-W17")).toBe("2026-W16");
    expect(PeriodKey.prior("week", "2026-W02")).toBe("2026-W01");
  });

  it("rolls week back from W01 to prior year (52-week year)", () => {
    // 2025 is a 52-week year (Jan 1 2025 is a Wednesday, not in a leap year).
    // 2026-W01 starts Mon Dec 29 2025; minus 1 week = Mon Dec 22 2025 = 2025-W52.
    expect(PeriodKey.prior("week", "2026-W01")).toBe("2025-W52");
  });

  it("rolls week back from W01 to prior year (53-week year)", () => {
    // 2026 is a 53-week year (Jan 1 2026 is Thursday).
    // 2027-W01 starts Mon Jan 4 2027; minus 1 week = Mon Dec 28 2026 = 2026-W53.
    expect(PeriodKey.prior("week", "2027-W01")).toBe("2026-W53");

    // 2020 is also a 53-week year.
    // 2021-W01 starts Mon Jan 4 2021; minus 1 week = Mon Dec 28 2020 = 2020-W53.
    expect(PeriodKey.prior("week", "2021-W01")).toBe("2020-W53");
  });

  it("throws for persistent horizons (they have no period to roll back)", () => {
    expect(() => PeriodKey.prior("life-values", "anything")).toThrow();
    expect(() => PeriodKey.prior("life-goals", "anything")).toThrow();
  });
});

describe("PeriodKey.format", () => {
  it("formats year as the bare year", () => {
    expect(PeriodKey.format("year", "2026")).toBe("2026");
    expect(PeriodKey.format("year", "1999")).toBe("1999");
  });

  it("formats month as 'Month YYYY'", () => {
    expect(PeriodKey.format("month", "2026-04")).toBe("April 2026");
    expect(PeriodKey.format("month", "2026-01")).toBe("January 2026");
    expect(PeriodKey.format("month", "2026-12")).toBe("December 2026");
  });

  it("formats week as 'Week N, YYYY' without leading zero", () => {
    expect(PeriodKey.format("week", "2026-W17")).toBe("Week 17, 2026");
    expect(PeriodKey.format("week", "2026-W01")).toBe("Week 1, 2026");
    expect(PeriodKey.format("week", "2020-W53")).toBe("Week 53, 2020");
  });

  it("throws for persistent horizons (they have no period to format)", () => {
    expect(() => PeriodKey.format("life-values", "anything")).toThrow();
    expect(() => PeriodKey.format("life-goals", "anything")).toThrow();
  });
});
