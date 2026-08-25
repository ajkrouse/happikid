import { describe, it, expect } from "vitest";
import {
  hasPricingData,
  getCostRange,
  getCostLevel,
  getBoroughColor,
  getPublicPriceRange,
  hasPublicPricingData,
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

describe("public pricing visibility", () => {
  it("does not return a usable numeric range when exact tuition is hidden", () => {
    const provider = {
      monthlyPrice: "2200",
      monthlyPriceMin: "1800",
      monthlyPriceMax: "2500",
      showExactPrice: false,
    };
    expect(hasPublicPricingData(provider)).toBe(false);
    expect(getPublicPriceRange(provider)).toBeNull();
  });

  it("returns the public range before a fixed fallback", () => {
    const provider = {
      monthlyPrice: "2200",
      monthlyPriceMin: "1800",
      monthlyPriceMax: "2500",
      showExactPrice: true,
    };
    expect(getPublicPriceRange(provider)).toEqual({ min: 1800, max: 2500 });
  });
});

// ---------------------------------------------------------------------------
// getCostRange — explicit pricing
// ---------------------------------------------------------------------------

describe("getCostRange — explicit pricing", () => {
  it("uses explicit range when both min and max are set", () => {
    const result = getCostRange({ ...base, monthlyPrice: "0", monthlyPriceMin: "1500", monthlyPriceMax: "2500" });
    expect(result).toEqual({ min: 1500, max: 2500 });
  });

  it("uses fixed monthlyPrice as both min and max", () => {
    const result = getCostRange({ ...base, monthlyPrice: "2000", monthlyPriceMin: null, monthlyPriceMax: null });
    expect(result).toEqual({ min: 2000, max: 2000 });
  });

  it("explicit range takes priority over fixed monthlyPrice", () => {
    const result = getCostRange({ ...base, monthlyPrice: "9999", monthlyPriceMin: "1500", monthlyPriceMax: "2500" });
    expect(result).toEqual({ min: 1500, max: 2500 });
  });
});

// ---------------------------------------------------------------------------
// getCostRange — all provider types with Brooklyn (multiplier 1.0) as baseline
// ---------------------------------------------------------------------------

describe("getCostRange — provider type estimates (Brooklyn, multiplier 1.0)", () => {
  const noPrice = { monthlyPrice: "0" as const, monthlyPriceMin: null as null, monthlyPriceMax: null as null };

  it("daycare: base 1800–3500", () => {
    const result = getCostRange({ ...noPrice, type: "daycare", borough: "Brooklyn", city: "Brooklyn" });
    expect(result).toEqual({ min: 1800, max: 3500 });
  });

  it("afterschool: base 800–1500", () => {
    const result = getCostRange({ ...noPrice, type: "afterschool", borough: "Brooklyn", city: "Brooklyn" });
    expect(result).toEqual({ min: 800, max: 1500 });
  });

  it("camp: base 1200–2000", () => {
    const result = getCostRange({ ...noPrice, type: "camp", borough: "Brooklyn", city: "Brooklyn" });
    expect(result).toEqual({ min: 1200, max: 2000 });
  });

  it("school: base 2500–4500", () => {
    const result = getCostRange({ ...noPrice, type: "school", borough: "Brooklyn", city: "Brooklyn" });
    expect(result).toEqual({ min: 2500, max: 4500 });
  });

  it("unknown type falls back to daycare base", () => {
    const result = getCostRange({ ...noPrice, type: "tutoring" as any, borough: "Brooklyn", city: "Brooklyn" });
    expect(result).toEqual({ min: 1800, max: 3500 });
  });
});

// ---------------------------------------------------------------------------
// getCostRange — all borough multipliers (daycare type)
// ---------------------------------------------------------------------------

describe("getCostRange — borough multipliers (daycare type, no explicit price)", () => {
  const noPrice = { monthlyPrice: "0" as const, monthlyPriceMin: null as null, monthlyPriceMax: null as null };
  const daycareBase = { min: 1800, max: 3500 };

  it("Manhattan multiplier 1.2", () => {
    const result = getCostRange({ ...noPrice, type: "daycare", borough: "Manhattan", city: "" });
    expect(result).toEqual({
      min: Math.round(daycareBase.min * 1.2),
      max: Math.round(daycareBase.max * 1.2),
    });
  });

  it("Brooklyn multiplier 1.0", () => {
    const result = getCostRange({ ...noPrice, type: "daycare", borough: "Brooklyn", city: "" });
    expect(result).toEqual({ min: 1800, max: 3500 });
  });

  it("Queens multiplier 0.9", () => {
    const result = getCostRange({ ...noPrice, type: "daycare", borough: "Queens", city: "" });
    expect(result).toEqual({
      min: Math.round(daycareBase.min * 0.9),
      max: Math.round(daycareBase.max * 0.9),
    });
  });

  it("Bronx multiplier 0.8", () => {
    const result = getCostRange({ ...noPrice, type: "daycare", borough: "Bronx", city: "" });
    expect(result).toEqual({
      min: Math.round(daycareBase.min * 0.8),
      max: Math.round(daycareBase.max * 0.8),
    });
  });

  it("Staten Island multiplier 0.85", () => {
    const result = getCostRange({ ...noPrice, type: "daycare", borough: "Staten Island", city: "" });
    expect(result).toEqual({
      min: Math.round(daycareBase.min * 0.85),
      max: Math.round(daycareBase.max * 0.85),
    });
  });

  it("unknown borough defaults to multiplier 1.0", () => {
    const result = getCostRange({ ...noPrice, type: "daycare", borough: "Westchester", city: "" });
    expect(result).toEqual({ min: 1800, max: 3500 });
  });
});

// ---------------------------------------------------------------------------
// getCostRange — NJ city multipliers (city wins over borough)
// ---------------------------------------------------------------------------

describe("getCostRange — NJ city multipliers (city takes precedence over borough)", () => {
  const noPrice = { monthlyPrice: "0" as const, monthlyPriceMin: null as null, monthlyPriceMax: null as null };
  const daycareBase = { min: 1800, max: 3500 };

  it("Hoboken multiplier 1.05, ignores borough", () => {
    const result = getCostRange({ ...noPrice, type: "daycare", borough: "Hudson County", city: "Hoboken" });
    expect(result).toEqual({
      min: Math.round(daycareBase.min * 1.05),
      max: Math.round(daycareBase.max * 1.05),
    });
  });

  it("Jersey City multiplier 0.95, ignores borough", () => {
    const result = getCostRange({ ...noPrice, type: "daycare", borough: "Hudson County", city: "Jersey City" });
    expect(result).toEqual({
      min: Math.round(daycareBase.min * 0.95),
      max: Math.round(daycareBase.max * 0.95),
    });
  });

  it("city multiplier applies even when borough is a known NYC borough", () => {
    // city takes precedence per the implementation
    const result = getCostRange({ ...noPrice, type: "daycare", borough: "Manhattan", city: "Hoboken" });
    expect(result).toEqual({
      min: Math.round(daycareBase.min * 1.05),
      max: Math.round(daycareBase.max * 1.05),
    });
  });
});

// ---------------------------------------------------------------------------
// getCostRange — all types × all multipliers cross-check
// ---------------------------------------------------------------------------

describe("getCostRange — type × multiplier cross-check", () => {
  const noPrice = { monthlyPrice: "0" as const, monthlyPriceMin: null as null, monthlyPriceMax: null as null };

  const types: Array<{ type: string; base: { min: number; max: number } }> = [
    { type: "daycare", base: { min: 1800, max: 3500 } },
    { type: "afterschool", base: { min: 800, max: 1500 } },
    { type: "camp", base: { min: 1200, max: 2000 } },
    { type: "school", base: { min: 2500, max: 4500 } },
  ];

  const boroughCases: Array<{ borough: string; multiplier: number }> = [
    { borough: "Manhattan", multiplier: 1.2 },
    { borough: "Brooklyn", multiplier: 1.0 },
    { borough: "Queens", multiplier: 0.9 },
    { borough: "Bronx", multiplier: 0.8 },
    { borough: "Staten Island", multiplier: 0.85 },
  ];

  for (const { type, base } of types) {
    for (const { borough, multiplier } of boroughCases) {
      it(`${type} in ${borough} (×${multiplier})`, () => {
        const result = getCostRange({ ...noPrice, type: type as any, borough, city: "" });
        expect(result).toEqual({
          min: Math.round(base.min * multiplier),
          max: Math.round(base.max * multiplier),
        });
      });
    }
  }
});

// ---------------------------------------------------------------------------
// getCostLevel — threshold boundaries
// ---------------------------------------------------------------------------

describe("getCostLevel — threshold boundaries", () => {
  // Exact boundary: midpoint === threshold → still in that tier
  it("midpoint exactly 1500 → level 1", () => {
    expect(getCostLevel({ min: 1500, max: 1500 })).toBe(1);
  });

  it("midpoint 1501 → level 2", () => {
    expect(getCostLevel({ min: 1501, max: 1501 })).toBe(2);
  });

  it("midpoint exactly 2200 → level 2", () => {
    expect(getCostLevel({ min: 2200, max: 2200 })).toBe(2);
  });

  it("midpoint 2201 → level 3", () => {
    expect(getCostLevel({ min: 2201, max: 2201 })).toBe(3);
  });

  it("midpoint exactly 2900 → level 3", () => {
    expect(getCostLevel({ min: 2900, max: 2900 })).toBe(3);
  });

  it("midpoint 2901 → level 4", () => {
    expect(getCostLevel({ min: 2901, max: 2901 })).toBe(4);
  });

  it("midpoint exactly 3600 → level 4", () => {
    expect(getCostLevel({ min: 3600, max: 3600 })).toBe(4);
  });

  it("midpoint 3601 → level 5", () => {
    expect(getCostLevel({ min: 3601, max: 3601 })).toBe(5);
  });

  // Interior of each tier using range midpoints
  it("returns 1 for midpoint well below 1500 (min=1000, max=1500)", () => {
    expect(getCostLevel({ min: 1000, max: 1500 })).toBe(1);
  });

  it("returns 2 for midpoint between 1500 and 2200 (min=1600, max=2200)", () => {
    expect(getCostLevel({ min: 1600, max: 2200 })).toBe(2);
  });

  it("returns 3 for midpoint between 2200 and 2900 (min=2200, max=2900)", () => {
    expect(getCostLevel({ min: 2200, max: 2900 })).toBe(3);
  });

  it("returns 4 for midpoint between 2900 and 3600 (min=2900, max=3600)", () => {
    expect(getCostLevel({ min: 2900, max: 3600 })).toBe(4);
  });

  it("returns 5 for midpoint above 3600 (min=3600, max=5000)", () => {
    expect(getCostLevel({ min: 3600, max: 5000 })).toBe(5);
  });

  it("returns 3 for NaN input", () => {
    expect(getCostLevel({ min: NaN, max: NaN })).toBe(3);
  });

  it("returns 3 for Infinity input", () => {
    expect(getCostLevel({ min: Infinity, max: Infinity })).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getBoroughColor
// ---------------------------------------------------------------------------

describe("getBoroughColor", () => {
  it("Manhattan → blue", () => {
    expect(getBoroughColor("Manhattan")).toBe("bg-blue-50 text-blue-700");
  });

  it("Brooklyn → green", () => {
    expect(getBoroughColor("Brooklyn")).toBe("bg-green-50 text-green-700");
  });

  it("Queens → purple", () => {
    expect(getBoroughColor("Queens")).toBe("bg-purple-50 text-purple-700");
  });

  it("Bronx → orange", () => {
    expect(getBoroughColor("Bronx")).toBe("bg-orange-50 text-orange-700");
  });

  it("Staten Island → red", () => {
    expect(getBoroughColor("Staten Island")).toBe("bg-red-50 text-red-700");
  });

  it("Hoboken (NJ city) → teal, regardless of borough", () => {
    expect(getBoroughColor("Hudson County", "Hoboken")).toBe("bg-teal-50 text-teal-700");
  });

  it("Jersey City (NJ city) → teal, regardless of borough", () => {
    expect(getBoroughColor("Hudson County", "Jersey City")).toBe("bg-teal-50 text-teal-700");
  });

  it("NJ city overrides a known NYC borough", () => {
    expect(getBoroughColor("Manhattan", "Hoboken")).toBe("bg-teal-50 text-teal-700");
  });

  it("unknown borough with no city → gray fallback", () => {
    expect(getBoroughColor("Westchester")).toBe("bg-gray-50 text-gray-700");
  });

  it("null city falls through to borough lookup", () => {
    expect(getBoroughColor("Queens", null)).toBe("bg-purple-50 text-purple-700");
  });

  it("undefined city falls through to borough lookup", () => {
    expect(getBoroughColor("Bronx", undefined)).toBe("bg-orange-50 text-orange-700");
  });

  it("unrecognised city falls through to borough lookup", () => {
    expect(getBoroughColor("Brooklyn", "Newark")).toBe("bg-green-50 text-green-700");
  });
});
