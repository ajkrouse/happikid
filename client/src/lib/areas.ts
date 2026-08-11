/**
 * Shared area options for HappiKid coverage.
 * Includes NYC boroughs plus Hoboken and Jersey City in NJ.
 * Used across FamilyProfileWizard, SearchFilters, and provider onboarding.
 */
export const AREAS = [
  "Brooklyn",
  "Manhattan",
  "Queens",
  "Bronx",
  "Staten Island",
  "Hoboken",
  "Jersey City",
];

/**
 * Areas located in New Jersey rather than NYC.
 */
export const NJ_AREAS = new Set(["Hoboken", "Jersey City"]);

/**
 * Format an area value for display, appending ", NJ" for New Jersey areas
 * and leaving NYC boroughs as-is.
 *
 * Examples:
 *   formatAreaLabel("Hoboken")     → "Hoboken, NJ"
 *   formatAreaLabel("Jersey City") → "Jersey City, NJ"
 *   formatAreaLabel("Brooklyn")    → "Brooklyn"
 */
export function formatAreaLabel(area: string): string {
  if (!area) return area;
  return NJ_AREAS.has(area) ? `${area}, NJ` : area;
}
