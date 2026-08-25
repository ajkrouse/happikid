export type SearchFiltersState = {
  type?: string;
  borough?: string;
  city?: string;
  ageRange?: string;
  priceRange?: string;
  features?: string[];
  category?: string;
  subcategory?: string;
  acceptsSubsidies?: boolean;
  verifiedPricing?: boolean;
  enrollmentStatus?: string;
  openOn?: string;
};

export type SearchSort = "best-match" | "highest-rated" | "lowest-price" | "highest-price" | "nearest" | "newest";

export type SearchUrlState = {
  searchQuery: string;
  filters: SearchFiltersState;
  sortBy: SearchSort;
  userLocation: { lat: number; lng: number } | null;
  searchRadius: number;
};

const providerTypes = new Set(["daycare", "afterschool", "camp", "school"]);
const ageRanges = new Set(["infants", "toddlers", "preschool", "school-age"]);
const priceRanges = new Set(["0-1000", "1000-2000", "2000-3000", "3000+"]);
const enrollmentStatuses = new Set(["accepting", "waitlist", "full"]);
const sortModes = new Set<SearchSort>(["best-match", "highest-rated", "lowest-price", "highest-price", "nearest", "newest"]);
const legacyCostToPrice: Record<string, string> = {
  "1": "0-1000",
  "2": "1000-2000",
  "3": "2000-3000",
  "4": "3000+",
  "5": "3000+",
};

function validCalendarDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validText(value: string | null, max = 100): value is string {
  return !!value && value.trim().length > 0 && value.trim().length <= max;
}

export function restoreSearchUrl(search: string): SearchUrlState {
  const params = new URLSearchParams(search);
  const filters: SearchFiltersState = {};
  const type = params.get("type");
  const borough = params.get("borough");
  const city = params.get("city");
  const ageRange = params.get("ageRange");
  const priceRange = params.get("priceRange") || legacyCostToPrice[params.get("cost") || ""];
  const features = params.get("features");
  const category = params.get("category");
  const subcategory = params.get("subcategory");
  const enrollmentStatus = params.get("enrollmentStatus");
  const openOn = params.get("openOn");
  const sortBy = params.get("sortBy");
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const radius = Number(params.get("radius"));

  if (type && providerTypes.has(type)) filters.type = type;
  if (validText(borough)) filters.borough = borough;
  if (validText(city)) filters.city = city;
  if (ageRange && ageRanges.has(ageRange)) filters.ageRange = ageRange;
  if (priceRange && priceRanges.has(priceRange)) filters.priceRange = priceRange;
  if (features) {
    const parsedFeatures = features.split(",").map((feature) => feature.trim()).filter(Boolean);
    if (parsedFeatures.length > 0 && parsedFeatures.length <= 50) filters.features = parsedFeatures;
  }
  if (validText(category) && validText(subcategory)) {
    filters.category = category;
    filters.subcategory = subcategory;
  }
  if (params.get("acceptsSubsidies") === "true") filters.acceptsSubsidies = true;
  if (params.get("verifiedPricing") === "true") filters.verifiedPricing = true;
  if (enrollmentStatus && enrollmentStatuses.has(enrollmentStatus)) filters.enrollmentStatus = enrollmentStatus;
  if (validCalendarDate(openOn)) filters.openOn = openOn;

  const validLocation =
    Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
    Number.isFinite(lng) && lng >= -180 && lng <= 180 &&
    Number.isInteger(radius) && radius >= 1 && radius <= 100;

  return {
    searchQuery: params.get("q")?.trim().slice(0, 200) || "",
    filters,
    sortBy: sortBy && sortModes.has(sortBy as SearchSort) && (sortBy !== "nearest" || validLocation)
      ? sortBy as SearchSort
      : "best-match",
    userLocation: validLocation ? { lat, lng } : null,
    searchRadius: validLocation ? radius : 5,
  };
}

export function serializeSearchUrl(state: SearchUrlState): string {
  const params = new URLSearchParams();
  const { filters } = state;
  if (state.searchQuery.trim()) params.set("q", state.searchQuery.trim());
  if (filters.type) params.set("type", filters.type);
  if (filters.borough) params.set("borough", filters.borough);
  if (filters.city) params.set("city", filters.city);
  if (filters.ageRange) params.set("ageRange", filters.ageRange);
  if (filters.priceRange) params.set("priceRange", filters.priceRange);
  if (filters.features?.length) params.set("features", filters.features.join(","));
  if (filters.category && filters.subcategory) {
    params.set("category", filters.category);
    params.set("subcategory", filters.subcategory);
  }
  if (filters.acceptsSubsidies) params.set("acceptsSubsidies", "true");
  if (filters.verifiedPricing) params.set("verifiedPricing", "true");
  if (filters.enrollmentStatus) params.set("enrollmentStatus", filters.enrollmentStatus);
  if (filters.openOn) params.set("openOn", filters.openOn);
  if (state.sortBy !== "best-match" && (state.sortBy !== "nearest" || state.userLocation)) {
    params.set("sortBy", state.sortBy);
  }
  if (state.userLocation) {
    params.set("lat", String(state.userLocation.lat));
    params.set("lng", String(state.userLocation.lng));
    params.set("radius", String(state.searchRadius));
  }
  return params.toString();
}