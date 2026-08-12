import { Provider } from "@shared/schema";

const TYPE_RANGES: Record<string, { min: number; max: number }> = {
  daycare: { min: 1800, max: 3500 },
  afterschool: { min: 800, max: 1500 },
  camp: { min: 1200, max: 2000 },
  school: { min: 2500, max: 4500 },
};

const BOROUGH_MULTIPLIERS: Record<string, number> = {
  Manhattan: 1.2,
  Brooklyn: 1.0,
  Queens: 0.9,
  Bronx: 0.8,
  "Staten Island": 0.85,
};

const CITY_MULTIPLIERS: Record<string, number> = {
  Hoboken: 1.05,
  "Jersey City": 0.95,
};

const BOROUGH_COLORS: Record<string, string> = {
  Manhattan: "bg-blue-50 text-blue-700",
  Brooklyn: "bg-green-50 text-green-700",
  Queens: "bg-purple-50 text-purple-700",
  Bronx: "bg-orange-50 text-orange-700",
  "Staten Island": "bg-red-50 text-red-700",
};

/**
 * Returns the estimated monthly cost range for a provider based on type and location.
 * If the provider has explicit DB price fields, use those instead.
 */
export function getCostRange(provider: Pick<Provider, "type" | "borough" | "city" | "monthlyPriceMin" | "monthlyPriceMax">): { min: number; max: number } {
  const hasDbPriceRange = provider.monthlyPriceMin && provider.monthlyPriceMax;
  if (hasDbPriceRange) {
    return {
      min: Number(provider.monthlyPriceMin),
      max: Number(provider.monthlyPriceMax),
    };
  }

  const baseRange = TYPE_RANGES[provider.type] ?? TYPE_RANGES.daycare;

  let multiplier = 1.0;
  if (provider.city && CITY_MULTIPLIERS[provider.city] !== undefined) {
    multiplier = CITY_MULTIPLIERS[provider.city];
  } else if (provider.borough && BOROUGH_MULTIPLIERS[provider.borough] !== undefined) {
    multiplier = BOROUGH_MULTIPLIERS[provider.borough];
  }

  return {
    min: Math.round(baseRange.min * multiplier),
    max: Math.round(baseRange.max * multiplier),
  };
}

/**
 * Returns a 1–5 dollar-sign level based on the midpoint of a cost range.
 * Thresholds are calibrated for NYC childcare pricing.
 */
export function getCostLevel(costRange: { min: number; max: number }): number {
  if (!costRange || typeof costRange.min !== "number" || typeof costRange.max !== "number") {
    return 3;
  }
  const midpoint = (costRange.min + costRange.max) / 2;
  if (midpoint <= 1500) return 1;
  if (midpoint <= 2200) return 2;
  if (midpoint <= 2900) return 3;
  if (midpoint <= 3600) return 4;
  return 5;
}

/**
 * Returns the Tailwind color classes for a borough/city badge.
 */
export function getBoroughColor(borough: string, city?: string | null): string {
  if (city === "Hoboken" || city === "Jersey City") {
    return "bg-teal-50 text-teal-700";
  }
  return BOROUGH_COLORS[borough] ?? "bg-gray-50 text-gray-700";
}
