import { describe, it, expect } from "vitest";
import {
  hasPricingData,
  getCostRange,
  getCostLevel,
} from "@/lib/providerPricing";

// Minimal provider shape used across tests
const base = {
  type: "daycare" as const,
  borough: "Brooklyn",
  city: "Brooklyn",
  monthlyPrice: "0",
  monthlyPriceMin: null,
  monthlyPriceMax: null,
  showExactPrice: true,
} as const;

// ---------------------------------------------------------------------------
// hasPricingData
// ---------------------------------------------------------------------------

describe("hasPricingData", () => {
  it("returns false when all price fields are absent/zero", () => {
    expect(hasPricingData({ monthlyPrice: "0", monthlyPriceMin: null, monthlyPriceMax: null })).toBe(false);
  });

  it("returns true for a fixed monthlyPrice > 0", () => {
    expect(hasPricingData({ monthlyPrice: "2000", monthlyPriceMin: null, monthlyPriceMax: null })).toBe(true);
  });

  it("returns true for an explicit range (min + max set)", () => {
    expect(hasPricingData({ monthlyPrice: "0", monthlyPriceMin: "1500", monthlyPriceMax: "2500" })).toBe(true);
  });

  it("returns true when both fixed and range fields are present (range takes priority)", () => {
    expect(hasPricingData({ monthlyPrice: "2000", monthlyPriceMin: "1500", monthlyPriceMax: "2500" })).toBe(true);
  });

  it("returns false when only one of min/max is set and monthlyPrice is 0", () => {
    expect(hasPricingData({ monthlyPrice: "0", monthlyPriceMin: "1500", monthlyPriceMax: null })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getCostRange
// ---------------------------------------------------------------------------

describe("getCostRange", () => {
  it("uses explicit range when both min and max are set", () => {
    const result = getCostRange({ ...base, monthlyPrice: "0", monthlyPriceMin: "1500", monthlyPriceMax: "2500" });
    expect(result).toEqual({ min: 1500, max: 2500 });
  });

  it("uses fixed monthlyPrice as both min and max", () => {
    const result = getCostRange({ ...base, monthlyPrice: "2000", monthlyPriceMin: null, monthlyPriceMax: null });
    expect(result).toEqual({ min: 2000, max: 2000 });
  });

  it("falls back to type×borough estimate when no price is provided", () => {
    const result = getCostRange({ ...base, monthlyPrice: "0", monthlyPriceMin: null, monthlyPriceMax: null });
    // Brooklyn multiplier = 1.0, daycare base = 1800–3500
    expect(result).toEqual({ min: 1800, max: 3500 });
  });

  it("applies borough multiplier in estimate fallback", () => {
    const result = getCostRange({ ...base, borough: "Manhattan", city: "Manhattan", monthlyPrice: "0" });
    // Manhattan multiplier = 1.2, daycare = 1800–3500
    expect(result).toEqual({ min: Math.round(1800 * 1.2), max: Math.round(3500 * 1.2) });
  });

  it("prefers city multiplier over borough multiplier in estimate", () => {
    const result = getCostRange({ ...base, borough: "Hudson County", city: "Hoboken", monthlyPrice: "0" });
    // Hoboken multiplier = 1.05
    expect(result).toEqual({ min: Math.round(1800 * 1.05), max: Math.round(3500 * 1.05) });
  });

  it("explicit range takes priority over fixed monthlyPrice", () => {
    const result = getCostRange({ ...base, monthlyPrice: "9999", monthlyPriceMin: "1500", monthlyPriceMax: "2500" });
    expect(result).toEqual({ min: 1500, max: 2500 });
  });
});

// ---------------------------------------------------------------------------
// getCostLevel
// ---------------------------------------------------------------------------

describe("getCostLevel", () => {
  it("returns 1 for midpoint ≤ 1500", () => {
    expect(getCostLevel({ min: 1000, max: 1500 })).toBe(1);
  });

  it("returns 2 for midpoint ≤ 2200", () => {
    expect(getCostLevel({ min: 1600, max: 2200 })).toBe(2);
  });

  it("returns 3 for midpoint ≤ 2900", () => {
    expect(getCostLevel({ min: 2200, max: 2900 })).toBe(3);
  });

  it("returns 4 for midpoint ≤ 3600", () => {
    expect(getCostLevel({ min: 2900, max: 3600 })).toBe(4);
  });

  it("returns 5 for midpoint > 3600", () => {
    expect(getCostLevel({ min: 3600, max: 5000 })).toBe(5);
  });

  it("returns 3 for degenerate/null input", () => {
    expect(getCostLevel({ min: NaN, max: NaN })).toBe(3);
  });
});
