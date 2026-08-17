import { describe, it, expect } from "vitest";
import { getClosingSoonEntry, formatClosureDateRange, localDateStr } from "../client/src/lib/closingSoon";

// Helper: produce a YYYY-MM-DD string offset from a base date by N days
function offsetDate(base: Date, days: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return localDateStr(d);
}

describe("localDateStr", () => {
  it("formats a date using local calendar components", () => {
    // Use an explicit local date to avoid any UTC-shift
    const d = new Date(2026, 7, 17); // Aug 17 2026, local
    expect(localDateStr(d)).toBe("2026-08-17");
  });

  it("zero-pads month and day", () => {
    const d = new Date(2026, 0, 5); // Jan 5
    expect(localDateStr(d)).toBe("2026-01-05");
  });
});

describe("getClosingSoonEntry", () => {
  const TODAY = new Date(2026, 7, 17); // Aug 17 2026 — fixed anchor for all tests

  it("returns null when closedDates is empty", () => {
    expect(getClosingSoonEntry([], TODAY)).toBeNull();
  });

  it("returns null when closedDates is not an array", () => {
    expect(getClosingSoonEntry(null, TODAY)).toBeNull();
    expect(getClosingSoonEntry(undefined, TODAY)).toBeNull();
    expect(getClosingSoonEntry({}, TODAY)).toBeNull();
  });

  it("returns an entry that starts today", () => {
    const entry = { from: offsetDate(TODAY, 0), to: offsetDate(TODAY, 3) };
    expect(getClosingSoonEntry([entry], TODAY)).toEqual(entry);
  });

  it("returns an entry that starts exactly 14 days from now (inclusive boundary)", () => {
    const entry = { from: offsetDate(TODAY, 14), to: offsetDate(TODAY, 16) };
    expect(getClosingSoonEntry([entry], TODAY)).toEqual(entry);
  });

  it("ignores an entry that starts 15 days from now (outside window)", () => {
    const entry = { from: offsetDate(TODAY, 15), to: offsetDate(TODAY, 17) };
    expect(getClosingSoonEntry([entry], TODAY)).toBeNull();
  });

  it("ignores entries entirely in the past", () => {
    const entry = { from: offsetDate(TODAY, -10), to: offsetDate(TODAY, -1) };
    expect(getClosingSoonEntry([entry], TODAY)).toBeNull();
  });

  it("ignores an entry whose from is in the past even if to is in the future", () => {
    // from before today → not a 'closing soon'; it's already started / ongoing
    const entry = { from: offsetDate(TODAY, -3), to: offsetDate(TODAY, 5) };
    expect(getClosingSoonEntry([entry], TODAY)).toBeNull();
  });

  it("returns the earliest entry when multiple qualify", () => {
    const later   = { from: offsetDate(TODAY, 10), to: offsetDate(TODAY, 12) };
    const earlier = { from: offsetDate(TODAY, 5),  to: offsetDate(TODAY, 7) };
    expect(getClosingSoonEntry([later, earlier], TODAY)).toEqual(earlier);
  });

  it("ignores out-of-window entries and returns the one that qualifies", () => {
    const outside = { from: offsetDate(TODAY, 20), to: offsetDate(TODAY, 25) };
    const inside  = { from: offsetDate(TODAY, 7),  to: offsetDate(TODAY, 9) };
    expect(getClosingSoonEntry([outside, inside], TODAY)).toEqual(inside);
  });

  it("uses local calendar dates — simulates UTC+14 timezone offset", () => {
    // In UTC+14 the local date is one full day ahead of UTC midnight.
    // We pass an explicit `today` so the function never calls `new Date()`,
    // which means the tz-correctness lives entirely in localDateStr.
    // This test confirms the function's string comparisons are based on the
    // passed-in `today` value (local calendar), not any UTC conversion.
    const utcAheadToday = new Date(2026, 7, 18); // Aug 18 in a UTC+14 locale
    const entryAug18 = { from: "2026-08-18", to: "2026-08-20" };
    const entryAug17 = { from: "2026-08-17", to: "2026-08-19" };
    // Aug 18 is today → qualifies; Aug 17 is yesterday → does not qualify
    expect(getClosingSoonEntry([entryAug18, entryAug17], utcAheadToday)).toEqual(entryAug18);
  });

  it("respects a custom windowDays parameter", () => {
    const entry7  = { from: offsetDate(TODAY, 7),  to: offsetDate(TODAY, 9) };
    const entry30 = { from: offsetDate(TODAY, 30), to: offsetDate(TODAY, 32) };
    // With a 5-day window: neither qualifies
    expect(getClosingSoonEntry([entry7, entry30], TODAY, 5)).toBeNull();
    // With a 31-day window: the 30-day one now qualifies
    expect(getClosingSoonEntry([entry7, entry30], TODAY, 31)).toEqual(entry7);
  });
});

describe("formatClosureDateRange", () => {
  it("formats a range within the same month", () => {
    const result = formatClosureDateRange({ from: "2026-08-25", to: "2026-08-30" });
    expect(result).toBe("Aug 25 – Aug 30");
  });

  it("formats a range spanning two months", () => {
    const result = formatClosureDateRange({ from: "2026-08-25", to: "2026-09-02" });
    expect(result).toBe("Aug 25 – Sep 2");
  });

  it("formats a single-day closure", () => {
    const result = formatClosureDateRange({ from: "2026-12-25", to: "2026-12-25" });
    expect(result).toBe("Dec 25 – Dec 25");
  });
});
