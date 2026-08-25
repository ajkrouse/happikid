import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "../server/db";
import { providers } from "@shared/schema";
import { DatabaseStorage } from "../server/storage";

const TEST_CITY = `__search_controls_${Date.now()}__`;
const storage = new DatabaseStorage();
let lowPriceNearId: number;
let midPriceId: number;
let highPriceFarId: number;

async function insertProvider(overrides: {
  name: string;
  monthlyPrice: string;
  lat: number;
  lng: number;
}): Promise<number> {
  const rows = await db.execute(sql`
    INSERT INTO providers (
      name, address, borough, city, state, zip_code, type,
      age_range_min, age_range_max, monthly_price,
      is_active, license_status, is_profile_visible, is_profile_public, lat, lng
    ) VALUES (
      ${overrides.name}, '1 Search Test Way', 'Test Borough', ${TEST_CITY}, 'NY', '10001', 'daycare',
      0, 60, ${overrides.monthlyPrice},
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
  });
  highPriceFarId = await insertProvider({
    name: "Search High Price Far",
    monthlyPrice: "3500",
    lat: 41.0000,
    lng: -74.0000,
  });
});

afterAll(async () => {
  await db.delete(providers).where(eq(providers.city, TEST_CITY));
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

    expect(nearby.map((provider) => provider.id)).toEqual([lowPriceNearId, midPriceId]);
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