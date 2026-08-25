/**
 * Storage integration tests — verified pricing filter in getProviders().
 *
 * These tests use the real database (via the NEON_DATABASE_URL connection) to
 * confirm the actual SQL expression that guards the verifiedPricing filter:
 *
 *   (monthlyPriceMin IS NOT NULL AND monthlyPriceMax IS NOT NULL)
 *   OR (monthlyPrice IS NOT NULL AND monthlyPrice::numeric > 0)
 *
 * Seeded providers are scoped to a unique city name that is deleted in afterAll,
 * so the tests are safe to run against the shared dev database.
 *
 * Raw SQL is used for the inserts to avoid schema-drift errors: some columns
 * present in the drizzle schema (e.g. license_submitted_at, enrollment_status)
 * have not yet been migrated to the live database. The reads go through the
 * real DatabaseStorage.getProviders() so the actual filter SQL is exercised.
 *
 * Test coverage:
 * 1. verifiedPricing:true returns only providers whose pricing columns satisfy the expression.
 * 2. Omitting verifiedPricing restores the full set (both verified and unverified providers).
 * 3. A provider with only monthlyPrice > 0 is correctly included by the filter.
 * 4. A provider with monthlyPrice = 0 and no price range is correctly excluded.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../server/db";
import { providers } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { DatabaseStorage } from "../server/storage";

// ---------------------------------------------------------------------------
// Isolated test scope — unique city keeps seeded rows isolated from real data
// ---------------------------------------------------------------------------

const TEST_CITY = `__vptest_${Date.now()}__`;
const storage = new DatabaseStorage();

// ---------------------------------------------------------------------------
// Seed & teardown using raw SQL (only columns that exist in the live DB)
// ---------------------------------------------------------------------------

let idRange: number;
let idFixed: number;
let idUnverified: number;
let idHidden: number;
let idMalformedRangeWithFixed: number;

async function insertTestProvider(overrides: {
  name: string;
  monthly_price: string;
  monthly_price_min: string | null;
  monthly_price_max: string | null;
  show_exact_price?: boolean;
}): Promise<number> {
  const rows = await db.execute(sql`
    INSERT INTO providers (
      name, address, borough, city, state, zip_code,
      type, age_range_min, age_range_max,
      monthly_price, monthly_price_min, monthly_price_max,
      is_active, license_status, is_profile_visible, show_exact_price
    ) VALUES (
      ${overrides.name},
      '123 Test St',
      'TestBorough',
      ${TEST_CITY},
      'NY',
      '10001',
      'daycare',
      0,
      60,
      ${overrides.monthly_price},
      ${overrides.monthly_price_min},
      ${overrides.monthly_price_max},
      true,
      'confirmed',
      true,
      ${overrides.show_exact_price ?? true}
    )
    RETURNING id
  `);
  return (rows.rows[0] as any).id as number;
}

beforeAll(async () => {
  // Provider 1: has a price range → verified pricing
  idRange = await insertTestProvider({
    name: "Range Provider",
    monthly_price: "0",
    monthly_price_min: "1500",
    monthly_price_max: "2500",
  });

  // Provider 2: positive fixed monthly price → verified pricing
  idFixed = await insertTestProvider({
    name: "Fixed Price Provider",
    monthly_price: "1800",
    monthly_price_min: null,
    monthly_price_max: null,
  });

  // Provider 3: monthlyPrice=0 and no range → NOT verified
  idUnverified = await insertTestProvider({
    name: "Unverified Provider",
    monthly_price: "0",
    monthly_price_min: null,
    monthly_price_max: null,
  });

  // Provider 4: private numeric pricing must never become a public pricing match.
  idHidden = await insertTestProvider({
    name: "Hidden Price Provider",
    monthly_price: "900",
    monthly_price_min: null,
    monthly_price_max: null,
    show_exact_price: false,
  });
  idMalformedRangeWithFixed = await insertTestProvider({
    name: "Malformed Range Fixed Price Provider",
    monthly_price: "1500",
    monthly_price_min: "3000",
    monthly_price_max: "2000",
  });
});

afterAll(async () => {
  await db.delete(providers).where(eq(providers.city, TEST_CITY));
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DatabaseStorage.getProviders() — verifiedPricing filter", () => {
  it("returns only providers with verified pricing when verifiedPricing:true", async () => {
    const result = await storage.getProviders({
      city: TEST_CITY,
      verifiedPricing: true,
      limit: 50,
    });

    const rows = Array.isArray(result) ? result : result.providers;
    const ids = rows.map((p) => p.id);

    // Both verified providers must be included
    expect(ids).toContain(idRange);
    expect(ids).toContain(idFixed);

    // The unverified provider must be excluded
    expect(ids).not.toContain(idUnverified);
    expect(ids).not.toContain(idHidden);
  });

  it("enabling the filter reduces results compared to the unfiltered query", async () => {
    const [unfilteredResult, filteredResult] = await Promise.all([
      storage.getProviders({ city: TEST_CITY, limit: 50 }),
      storage.getProviders({ city: TEST_CITY, verifiedPricing: true, limit: 50 }),
    ]);

    const unfilteredCount = Array.isArray(unfilteredResult)
      ? unfilteredResult.length
      : unfilteredResult.providers.length;
    const filteredCount = Array.isArray(filteredResult)
      ? filteredResult.length
      : filteredResult.providers.length;

    // The filter must narrow the result set
    expect(filteredCount).toBeLessThan(unfilteredCount);
    expect(unfilteredCount).toBe(5);
    expect(filteredCount).toBe(3);
  });

  it("restores the full result set when verifiedPricing is omitted (filter cleared)", async () => {
    const result = await storage.getProviders({ city: TEST_CITY, limit: 50 });

    const rows = Array.isArray(result) ? result : result.providers;
    const ids = rows.map((p) => p.id);

    // All three seeded providers must appear
    expect(ids).toContain(idRange);
    expect(ids).toContain(idFixed);
    expect(ids).toContain(idUnverified);
  });

  it("includes a provider whose only pricing signal is a positive fixed monthlyPrice", async () => {
    const result = await storage.getProviders({
      city: TEST_CITY,
      verifiedPricing: true,
      limit: 50,
    });

    const rows = Array.isArray(result) ? result : result.providers;
    const ids = rows.map((p) => p.id);

    expect(ids).toContain(idFixed);
  });

  it("excludes a provider whose monthlyPrice is 0 and has no price range", async () => {
    const result = await storage.getProviders({
      city: TEST_CITY,
      verifiedPricing: true,
      limit: 50,
    });

    const rows = Array.isArray(result) ? result : result.providers;
    const ids = rows.map((p) => p.id);

    expect(ids).not.toContain(idUnverified);
  });

  it("does not let hidden exact tuition affect public price filters, counts, or sorting", async () => {
    const [budgetResult, lowestResult, metadataResult] = await Promise.all([
      storage.getProviders({ city: TEST_CITY, priceMax: 1000, limit: 50 }),
      storage.getProviders({ city: TEST_CITY, sortBy: "lowest-price", limit: 50 }),
      storage.getProviders({ city: TEST_CITY, returnTotal: true, limit: 50 }),
    ]);

    const budgetIds = (Array.isArray(budgetResult) ? budgetResult : budgetResult.providers).map((p) => p.id);
    const lowestIds = (Array.isArray(lowestResult) ? lowestResult : lowestResult.providers).map((p) => p.id);
    const metadata = metadataResult as { verifiedPricingCount: number };

    expect(budgetIds).not.toContain(idHidden);
    expect(lowestIds.indexOf(idHidden)).toBeGreaterThan(lowestIds.indexOf(idFixed));
    expect(Number(metadata.verifiedPricingCount)).toBe(3);
  });

  it("uses a valid fixed price when legacy range bounds are malformed", async () => {
    const [budgetResult, lowestResult] = await Promise.all([
      storage.getProviders({ city: TEST_CITY, priceMin: 1400, priceMax: 1600, limit: 50 }),
      storage.getProviders({ city: TEST_CITY, sortBy: "lowest-price", limit: 50 }),
    ]);

    const budgetIds = (Array.isArray(budgetResult) ? budgetResult : budgetResult.providers).map((p) => p.id);
    const lowestIds = (Array.isArray(lowestResult) ? lowestResult : lowestResult.providers).map((p) => p.id);

    expect(budgetIds).toContain(idMalformedRangeWithFixed);
    expect(lowestIds.indexOf(idMalformedRangeWithFixed)).toBeLessThan(lowestIds.indexOf(idRange));
  });
});
