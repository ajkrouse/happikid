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
 * Returns true when the provider has explicitly entered verified pricing data.
 * Accepts either:
 *  - An explicit price range (monthlyPriceMin + monthlyPriceMax both set), or
 *  - A fixed monthly price (monthlyPrice > 0).
 * When false, cost display is an estimate derived from type × borough multipliers.
 */
export function hasPricingData(
  provider: Pick<Provider, "monthlyPrice" | "monthlyPriceMin" | "monthlyPriceMax">
): boolean {
  if (
    Number(provider.monthlyPriceMin) > 0 &&
    Number(provider.monthlyPriceMax) > 0 &&
    Number(provider.monthlyPriceMin) <= Number(provider.monthlyPriceMax)
  ) return true;
  if (provider.monthlyPrice && Number(provider.monthlyPrice) > 0) return true;
  return false;
}

/**
 * Returns true only for provider-entered exact pricing that families are
 * allowed to use. Estimates are intentionally excluded from filters, score
 * calculations, and price sorts.
 */
export function hasPublicPricingData(
  provider: Pick<Provider, "monthlyPrice" | "monthlyPriceMin" | "monthlyPriceMax" | "showExactPrice">,
): boolean {
  return provider.showExactPrice !== false && hasPricingData(provider);
}

/**
 * Provides an approved numeric price range, or null when the price is hidden,
 * missing, or malformed. Family-facing price decisions must use this rather
 * than reading database fields directly.
 */
export function getPublicPriceRange(
  provider: Pick<Provider, "monthlyPrice" | "monthlyPriceMin" | "monthlyPriceMax" | "showExactPrice">,
): { min: number; max: number } | null {
  if (!hasPublicPricingData(provider)) return null;
  if (
    Number(provider.monthlyPriceMin) > 0 &&
    Number(provider.monthlyPriceMax) > 0 &&
    Number(provider.monthlyPriceMin) <= Number(provider.monthlyPriceMax)
  ) {
    return { min: Number(provider.monthlyPriceMin), max: Number(provider.monthlyPriceMax) };
  }

  const fixedPrice = Number(provider.monthlyPrice);
  return fixedPrice > 0 ? { min: fixedPrice, max: fixedPrice } : null;
}

/**
 * Returns the monthly cost range for a provider.
 * Priority:
 *  1. Explicit range (monthlyPriceMin + monthlyPriceMax)
 *  2. Fixed price (monthlyPrice > 0) — treated as a point estimate (min === max)
 *  3. Type × location estimate fallback
 */
export function getCostRange(
  provider: Pick<Provider, "type" | "borough" | "city" | "monthlyPrice" | "monthlyPriceMin" | "monthlyPriceMax"> & {
    showExactPrice?: boolean | null;
  },
): { min: number; max: number } {
  // Explicit range wins
  const publicPriceRange = getPublicPriceRange({
    ...provider,
    showExactPrice: provider.showExactPrice ?? true,
  });
  if (publicPriceRange) {
    return {
      min: publicPriceRange.min,
      max: publicPriceRange.max,
    };
  }

  // Fallback: type × location estimate
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
  if (
    !costRange ||
    !Number.isFinite(costRange.min) ||
    !Number.isFinite(costRange.max)
  ) {
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

/**
 * Formats a cost range for display, respecting the provider's showExactPrice flag.
 * When showExactPrice is false, returns null (caller should hide dollar amounts and
 * show only the $$ meter).
 */
export function formatCostRange(
  provider: Pick<Provider, "type" | "borough" | "city" | "monthlyPrice" | "monthlyPriceMin" | "monthlyPriceMax" | "showExactPrice">
): { range: { min: number; max: number }; showAmounts: boolean } {
  const range = getCostRange(provider);
  const showAmounts = hasPublicPricingData(provider);
  return { range, showAmounts };
}
