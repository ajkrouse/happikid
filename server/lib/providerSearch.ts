import { z } from "zod";

export const providerSearchTypes = ["daycare", "afterschool", "camp", "school"] as const;
export const providerSearchAgeRanges = ["infants", "toddlers", "preschool", "school-age"] as const;
export const providerSearchPriceRanges = ["0-1000", "1000-2000", "2000-3000", "3000+"] as const;
export const providerSearchSortModes = [
  "best-match",
  "highest-rated",
  "lowest-price",
  "highest-price",
  "nearest",
  "newest",
] as const;
export const providerSearchEnrollmentStatuses = ["accepting", "waitlist", "full"] as const;

const nonEmptyQueryString = (max: number) =>
  z.string().trim().min(1).max(max);

const strictInteger = (min: number, max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value === "string" && /^(0|[1-9]\d*)$/.test(value)) {
        return Number(value);
      }
      return value;
    },
    z.number().int().min(min).max(max),
  );

const strictBoolean = z.preprocess(
  (value) => value === "true" ? true : value === "false" ? false : value,
  z.boolean(),
);

const strictDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "openOn must be a valid calendar date");

const featureList = z.string().trim().min(1).max(2000)
  .transform((value) => value.split(",").map((feature) => feature.trim()).filter(Boolean))
  .refine((features) => features.length >= 1 && features.length <= 50, {
    message: "features must contain between 1 and 50 values",
  });

const rawProviderSearchQuerySchema = z.object({
  type: z.enum(providerSearchTypes).optional(),
  borough: nonEmptyQueryString(100).optional(),
  city: nonEmptyQueryString(100).optional(),
  ageRange: z.enum(providerSearchAgeRanges).optional(),
  ageRangeMin: strictInteger(0, 240).optional(),
  ageRangeMax: strictInteger(0, 240).optional(),
  features: featureList.optional(),
  search: z.string().trim().max(200).optional(),
  category: nonEmptyQueryString(100).optional(),
  subcategory: nonEmptyQueryString(100).optional(),
  limit: strictInteger(1, 100).default(20),
  offset: strictInteger(0, 1_000_000).default(0),
  aiSummary: strictBoolean.optional(),
  acceptsSubsidies: strictBoolean.optional(),
  verifiedPricing: strictBoolean.optional(),
  enrollmentStatus: z.enum(providerSearchEnrollmentStatuses).optional(),
  openOn: strictDate.optional(),
  priceRange: z.enum(providerSearchPriceRanges).optional(),
  // `cost` is retained for old shared links and is converted below.
  cost: z.enum(["1", "2", "3", "4", "5"]).optional(),
  lat: z.preprocess(
    (value) => typeof value === "string" && /^-?(?:\d+|\d*\.\d+)$/.test(value) ? Number(value) : value,
    z.number().finite().min(-90).max(90).optional(),
  ),
  lng: z.preprocess(
    (value) => typeof value === "string" && /^-?(?:\d+|\d*\.\d+)$/.test(value) ? Number(value) : value,
    z.number().finite().min(-180).max(180).optional(),
  ),
  radius: strictInteger(1, 100).optional(),
  sortBy: z.enum(providerSearchSortModes).default("best-match"),
}).strict();

const legacyCostToPriceRange: Record<string, (typeof providerSearchPriceRanges)[number]> = {
  "1": "0-1000",
  "2": "1000-2000",
  "3": "2000-3000",
  "4": "3000+",
  "5": "3000+",
};

export type ProviderSearchQuery = Omit<z.infer<typeof rawProviderSearchQuerySchema>, "cost" | "aiSummary"> & {
  aiSummary?: boolean;
  priceRange?: (typeof providerSearchPriceRanges)[number];
};

export function parseProviderSearchQuery(query: unknown): ProviderSearchQuery {
  const parsed = rawProviderSearchQuerySchema.parse(query);
  if ((parsed.lat === undefined) !== (parsed.lng === undefined)) {
    throw new z.ZodError([{
      code: z.ZodIssueCode.custom,
      message: "lat and lng must be provided together",
      path: ["lat"],
    }]);
  }
  if (parsed.radius !== undefined && parsed.lat === undefined) {
    throw new z.ZodError([{
      code: z.ZodIssueCode.custom,
      message: "radius requires lat and lng",
      path: ["radius"],
    }]);
  }
  if (parsed.sortBy === "nearest" && parsed.lat === undefined) {
    throw new z.ZodError([{
      code: z.ZodIssueCode.custom,
      message: "sortBy=nearest requires lat and lng",
      path: ["sortBy"],
    }]);
  }
  if (parsed.ageRangeMin !== undefined && parsed.ageRangeMax !== undefined && parsed.ageRangeMin > parsed.ageRangeMax) {
    throw new z.ZodError([{
      code: z.ZodIssueCode.custom,
      message: "ageRangeMin cannot exceed ageRangeMax",
      path: ["ageRangeMin"],
    }]);
  }
  if ((parsed.category === undefined) !== (parsed.subcategory === undefined)) {
    throw new z.ZodError([{
      code: z.ZodIssueCode.custom,
      message: "category and subcategory must be provided together",
      path: ["category"],
    }]);
  }

  const { cost, aiSummary, ...rest } = parsed;
  return {
    ...rest,
    aiSummary,
    priceRange: rest.priceRange ?? (cost ? legacyCostToPriceRange[cost] : undefined),
  };
}

export function formatProviderSearchValidationError(error: z.ZodError): string {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  }).join("; ");
}