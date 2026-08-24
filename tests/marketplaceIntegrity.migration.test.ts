/**
 * Development database migration verification for marketplace integrity.
 *
 * These assertions exercise the actual PostgreSQL constraints and trigger,
 * rather than only their Drizzle definitions. Every data test runs in a
 * transaction that is intentionally rolled back.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { db } from "../server/db";
import { providerProfileViews, providers, reviews, users } from "@shared/schema";
import { sql } from "drizzle-orm";

class TestRollback extends Error {}

function postgresCode(error: unknown): string | undefined {
  const typed = error as { code?: string; cause?: { code?: string } };
  return typed.code ?? typed.cause?.code;
}

async function expectDatabaseConstraint(
  work: (tx: typeof db) => Promise<void>,
  code: "23505" | "23514",
) {
  let thrown: unknown;
  try {
    await db.transaction(async (tx) => {
      await work(tx as typeof db);
    });
  } catch (error) {
    thrown = error;
  }
  expect(postgresCode(thrown)).toBe(code);
}

async function insertProviderAndParent(tx: typeof db, suffix: string) {
  const [provider] = await tx.insert(providers).values({
    name: `Integrity Test Provider ${suffix}`,
    address: "1 Test Street",
    borough: "Test Borough",
    city: "Integrity Test City",
    state: "NY",
    zipCode: "10001",
    type: "daycare",
    ageRangeMin: 0,
    ageRangeMax: 60,
    monthlyPrice: "1000",
  }).returning({ id: providers.id });
  const userId = `integrity-parent-${suffix}`;
  await tx.insert(users).values({ id: userId });
  return { providerId: provider.id, userId };
}

describe("marketplace integrity migration", () => {
  it("applies feature search as an incremental migration after the recorded integrity base", async () => {
    const journal = JSON.parse(readFileSync("migrations/meta/_journal.json", "utf8")) as {
      entries: Array<{ tag: string; when: number }>;
    };
    const baseMigration = journal.entries.find((entry) => entry.tag === "0010_marketplace_integrity");
    const featureMigration = journal.entries.find((entry) => entry.tag === "0011_marketplace_feature_search_index");
    expect(baseMigration).toBeDefined();
    expect(featureMigration).toBeDefined();
    expect(featureMigration!.when).toBeGreaterThan(baseMigration!.when);

    const result = await db.execute(sql`
      SELECT created_at
      FROM drizzle.__drizzle_migrations
      WHERE created_at IN (${baseMigration!.when}, ${featureMigration!.when})
      ORDER BY created_at
    `);
    expect(result.rows.map((row: { created_at: string | number }) => Number(row.created_at)))
      .toEqual([baseMigration!.when, featureMigration!.when]);
  });

  it("installs every public-search index used by the marketplace query", async () => {
    const result = await db.execute(sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'providers_public_search_filters_idx',
          'providers_public_name_trgm_idx',
          'providers_public_description_trgm_idx',
          'providers_public_address_trgm_idx',
          'providers_public_city_trgm_idx',
          'providers_public_features_trgm_idx'
        )
    `);
    const names = new Set(result.rows.map((row: { indexname: string }) => row.indexname));
    expect(names).toEqual(new Set([
      "providers_public_search_filters_idx",
      "providers_public_name_trgm_idx",
      "providers_public_description_trgm_idx",
      "providers_public_address_trgm_idx",
      "providers_public_city_trgm_idx",
      "providers_public_features_trgm_idx",
    ]));
  });

  it("rejects duplicate per-viewer daily views", async () => {
    await expectDatabaseConstraint(async (tx) => {
      const { providerId } = await insertProviderAndParent(tx, "views");
      const row = { providerId, viewerKey: "a".repeat(64), viewedDate: "2026-08-24", count: 1 };
      await tx.insert(providerProfileViews).values(row);
      await tx.insert(providerProfileViews).values(row);
    }, "23505");
  });

  it("rejects duplicate parent reviews and ratings outside one through five", async () => {
    await expectDatabaseConstraint(async (tx) => {
      const { providerId, userId } = await insertProviderAndParent(tx, "duplicate-review");
      await tx.insert(reviews).values({ providerId, userId, rating: 5 });
      await tx.insert(reviews).values({ providerId, userId, rating: 4 });
    }, "23505");

    await expectDatabaseConstraint(async (tx) => {
      const { providerId, userId } = await insertProviderAndParent(tx, "rating-bounds");
      await tx.insert(reviews).values({ providerId, userId, rating: 0 });
    }, "23514");
  });

  it("rejects direct SQL writes with overlapping or malformed closure ranges", async () => {
    await expectDatabaseConstraint(async (tx) => {
      const { providerId } = await insertProviderAndParent(tx, "overlap");
      await tx.update(providers).set({
        closedDates: [
          { from: "2026-12-20", to: "2026-12-24" },
          { from: "2026-12-24", to: "2026-12-27" },
        ],
      }).where(sql`${providers.id} = ${providerId}`);
    }, "23514");

    await expectDatabaseConstraint(async (tx) => {
      const { providerId } = await insertProviderAndParent(tx, "calendar-date");
      await tx.update(providers).set({
        closedDates: [{ from: "2026-02-30", to: "2026-03-02" }],
      }).where(sql`${providers.id} = ${providerId}`);
    }, "23514");
  });
});