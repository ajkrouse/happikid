import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "../server/db";
import { providers } from "@shared/schema";
import { DatabaseStorage } from "../server/storage";

const TEST_CITY = `__search_controls_${Date.now()}__`;
const OTHER_CITY = `__search_controls_other_${Date.now()}__`;
const storage = new DatabaseStorage();
let lowPriceNearId: number;
let midPriceId: number;
let midPriceSecondId: number;
let highPriceFarId: number;
let otherCityId: number;

async function insertProvider(overrides: {
  name: string;
  monthlyPrice: string;
  lat: number;
  lng: number;
  city?: string;
  borough?: string;
  type?: "daycare" | "afterschool" | "camp" | "school";
  ageRangeMin?: number;
  ageRangeMax?: number;
  features?: string[];
  acceptsSubsidies?: boolean;
  enrollmentStatus?: "accepting" | "waitlist" | "full";
  closedDates?: Array<{ from: string; to: string; reason?: string }>;
}): Promise<number> {
  const rows = await db.execute(sql`
    INSERT INTO providers (
      name, address, borough, city, state, zip_code, type,
      age_range_min, age_range_max, monthly_price,
      features, accepts_subsidies, enrollment_status, closed_dates,
      is_active, license_status, is_profile_visible, is_profile_public, lat, lng
    ) VALUES (
      ${overrides.name}, '1 Search Test Way', ${overrides.borough ?? "Test Borough"}, ${overrides.city ?? TEST_CITY}, 'NY', '10001', ${overrides.type ?? "daycare"},
      ${overrides.ageRangeMin ?? 0}, ${overrides.ageRangeMax ?? 60}, ${overrides.monthlyPrice},
      ${overrides.features
        ? sql`ARRAY[${sql.join(overrides.features.map((feature) => sql`${feature}`), sql`, `)}]::text[]`
        : sql`NULL`}, ${overrides.acceptsSubsidies ?? false}, ${overrides.enrollmentStatus ?? "accepting"},
      ${JSON.stringify(overrides.closedDates ?? [])}::jsonb,
      true, 'confirmed', true, true, ${overrides.lat}, ${overrides.lng}
    )
    RETURNING id
  `);
  return (rows.rows[0] as { id: number }).id;
}

beforeAll(async () => {
  lowPriceNearId = await insertProvider({
    name: "Search Low Price Near",
    monthlyPrice: "750",
    lat: 40.7000,
    lng: -74.0000,
  });
  midPriceId = await insertProvider({
    name: "Search Mid Price",
    monthlyPrice: "1500",
    lat: 40.7300,
    lng: -74.0000,
    type: "afterschool",
    ageRangeMin: 36,
    ageRangeMax: 120,
    features: ["Homework help", "Art programs"],
    acceptsSubsidies: true,
    enrollmentStatus: "waitlist",
    closedDates: [{ from: "2026-09-09", to: "2026-09-11", reason: "Staff training" }],
  });
  midPriceSecondId = await insertProvider({
    name: "Search Mid Price Two",
    monthlyPrice: "0",
    lat: 40.7350,
    lng: -74.0000,
    type: "afterschool",
    ageRangeMin: 36,
    ageRangeMax: 120,
    features: ["Homework help"],
    acceptsSubsidies: true,
    enrollmentStatus: "waitlist",
  });
  highPriceFarId = await insertProvider({
    name: "Search High Price Far",
    monthlyPrice: "3500",
    lat: 41.0000,
    lng: -74.0000,
    type: "camp",
    ageRangeMin: 60,
    ageRangeMax: 144,
    features: ["Swimming pool", "Nature trails"],
  });
  otherCityId = await insertProvider({
    name: "Search Other City",
    monthlyPrice: "2400",
    lat: 40.7400,
    lng: -74.1000,
    city: OTHER_CITY,
    borough: "Hudson County",
    type: "school",
  });
});

afterAll(async () => {
  await db.delete(providers).where(eq(providers.city, TEST_CITY));
  await db.delete(providers).where(eq(providers.city, OTHER_CITY));
});

function rows(result: Awaited<ReturnType<DatabaseStorage["getProviders"]>>) {
  return Array.isArray(result) ? result : result.providers;
}

describe("DatabaseStorage.getProviders search controls", () => {
  it("filters price bands and restores all prices when the price filter is cleared", async () => {
    const lowPrice = rows(await storage.getProviders({
      city: TEST_CITY,
      priceRange: "0-1000",
      limit: 20,
    }));
    const unfiltered = rows(await storage.getProviders({ city: TEST_CITY, limit: 20 }));

    expect(lowPrice.map((provider) => provider.id)).toEqual([lowPriceNearId]);
    expect(unfiltered.map((provider) => provider.id)).toEqual(
      expect.arrayContaining([lowPriceNearId, midPriceId, highPriceFarId]),
    );
  });

  it("applies nearest/radius filtering and each price ordering", async () => {
    const nearby = rows(await storage.getProviders({
      city: TEST_CITY,
      lat: 40.7000,
      lng: -74.0000,
      radius: 5,
      sortBy: "nearest",
      limit: 20,
    }));
    const lowest = rows(await storage.getProviders({
      city: TEST_CITY,
      sortBy: "lowest-price",
      limit: 20,
    }));
    const highest = rows(await storage.getProviders({
      city: TEST_CITY,
      sortBy: "highest-price",
      limit: 20,
    }));

    expect(nearby.map((provider) => provider.id)).toEqual([
      lowPriceNearId,
      midPriceId,
      midPriceSecondId,
    ]);
    expect(lowest.slice(0, 3).map((provider) => provider.id)).toEqual([
      lowPriceNearId,
      midPriceId,
      highPriceFarId,
    ]);
    expect(highest.slice(0, 3).map((provider) => provider.id)).toEqual([
      highPriceFarId,
      midPriceId,
      lowPriceNearId,
    ]);
  });

  it("changes results for type, city, age, feature, subsidy, enrollment, and open-on filters", async () => {
    const typeResults = rows(await storage.getProviders({ city: TEST_CITY, type: "camp", limit: 20 }));
    const cityResults = rows(await storage.getProviders({ city: OTHER_CITY, limit: 20 }));
    const ageResults = rows(await storage.getProviders({ city: TEST_CITY, ageRangeMin: 130, ageRangeMax: 150, limit: 20 }));
    const featureResults = rows(await storage.getProviders({ city: TEST_CITY, features: ["Swimming pool"], limit: 20 }));
    const subsidyResults = rows(await storage.getProviders({ city: TEST_CITY, acceptsSubsidies: true, limit: 20 }));
    const enrollmentResults = rows(await storage.getProviders({ city: TEST_CITY, enrollmentStatus: "waitlist", limit: 20 }));
    const closedOnResults = rows(await storage.getProviders({ city: TEST_CITY, openOn: "2026-09-10", limit: 20 }));
    const openOnResults = rows(await storage.getProviders({ city: TEST_CITY, openOn: "2026-09-20", limit: 20 }));

    expect(typeResults.map((provider) => provider.id)).toEqual([highPriceFarId]);
    expect(cityResults.map((provider) => provider.id)).toEqual([otherCityId]);
    expect(ageResults.map((provider) => provider.id)).toEqual([highPriceFarId]);
    expect(featureResults.map((provider) => provider.id)).toEqual([highPriceFarId]);
    expect(subsidyResults.map((provider) => provider.id)).toEqual(
      expect.arrayContaining([midPriceId, midPriceSecondId]),
    );
    expect(enrollmentResults.map((provider) => provider.id)).toEqual(
      expect.arrayContaining([midPriceId, midPriceSecondId]),
    );
    expect(closedOnResults.map((provider) => provider.id)).not.toContain(midPriceId);
    expect(openOnResults.map((provider) => provider.id)).toContain(midPriceId);
  });

  it("applies combined filters and returns full totals across pagination", async () => {
    const pageOne = await storage.getProviders({
      city: TEST_CITY,
      type: "afterschool",
      acceptsSubsidies: true,
      enrollmentStatus: "waitlist",
      openOn: "2026-09-20",
      limit: 1,
      offset: 0,
      returnTotal: true,
    });
    const pageTwo = await storage.getProviders({
      city: TEST_CITY,
      type: "afterschool",
      acceptsSubsidies: true,
      enrollmentStatus: "waitlist",
      openOn: "2026-09-20",
      limit: 1,
      offset: 1,
      returnTotal: true,
    });

    expect(pageOne).not.toBeInstanceOf(Array);
    expect(pageTwo).not.toBeInstanceOf(Array);
    const first = pageOne as { providers: Array<{ id: number }>; total: number; verifiedPricingCount: number };
    const second = pageTwo as { providers: Array<{ id: number }>; total: number; verifiedPricingCount: number };
    expect(first.providers.map((provider) => provider.id)).toEqual([midPriceId]);
    expect(second.providers.map((provider) => provider.id)).toEqual([midPriceSecondId]);
    expect(Number(first.total)).toBe(2);
    expect(Number(second.total)).toBe(2);
    expect(Number(first.verifiedPricingCount)).toBe(1);
    expect(Number(second.verifiedPricingCount)).toBe(1);
  });

  it("fails closed when category taxonomy lookup fails", async () => {
    const taxonomyFailure = vi
      .spyOn(storage, "getAfterSchoolTaxonomy")
      .mockRejectedValueOnce(new Error("taxonomy unavailable"));

    const result = rows(await storage.getProviders({
      city: TEST_CITY,
      category: "arts",
      subcategory: "dance",
      limit: 20,
    }));

    expect(result).toEqual([]);
    taxonomyFailure.mockRestore();
  });
});