/**
 * Storage integration tests — concurrent favorite and profile-view writes.
 *
 * These tests use a unique provider and parent in the shared development
 * database, then remove them afterwards. They verify the actual PostgreSQL
 * unique constraints and transaction behavior rather than only mocked calls.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "../server/db";
import { DatabaseStorage } from "../server/storage";
import { favorites, providerProfileViews, providers, threads, users } from "@shared/schema";

const TEST_SCOPE = `__idempotency_${Date.now()}__`;
const TEST_USER_ID = `${TEST_SCOPE}_parent`;
const TEST_VIEWER_KEY = "a".repeat(64);
const storage = new DatabaseStorage();

let providerId: number;

beforeAll(async () => {
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: `${TEST_SCOPE}@example.test`,
    role: "parent",
  });

  const [provider] = await db
    .insert(providers)
    .values({
      name: `${TEST_SCOPE} Provider`,
      address: "1 Test Way",
      borough: "Manhattan",
      city: TEST_SCOPE,
      state: "NY",
      zipCode: "10001",
      type: "daycare",
      ageRangeMin: 12,
      ageRangeMax: 60,
      monthlyPrice: "1000",
    })
    .returning({ id: providers.id });
  providerId = provider.id;
});

afterAll(async () => {
  if (providerId) {
    await db.delete(providers).where(eq(providers.id, providerId));
  }
  await db.delete(users).where(eq(users.id, TEST_USER_ID));
});

describe("DatabaseStorage high-frequency actions", () => {
  it("makes concurrent favorite requests idempotent and increments analytics once", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, () => storage.addFavorite(TEST_USER_ID, providerId)),
    );

    expect(results).toHaveLength(12);
    expect(results.filter((result) => result.created)).toHaveLength(1);
    expect(new Set(results.map((result) => `${result.favorite.userId}:${result.favorite.providerId}`))).toEqual(
      new Set([`${TEST_USER_ID}:${providerId}`]),
    );

    const savedFavorites = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, TEST_USER_ID), eq(favorites.providerId, providerId)));
    expect(savedFavorites).toHaveLength(1);

    const [provider] = await db
      .select({ favoriteAdds: providers.favoriteAdds })
      .from(providers)
      .where(eq(providers.id, providerId));
    expect(Number(provider.favoriteAdds)).toBe(1);
  });

  it("records one concurrent daily view and increments analytics once", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, () => storage.trackProfileView(providerId, TEST_VIEWER_KEY)),
    );

    expect(results.filter(Boolean)).toHaveLength(1);

    const viewRows = await db
      .select()
      .from(providerProfileViews)
      .where(
        and(
          eq(providerProfileViews.providerId, providerId),
          eq(providerProfileViews.viewerKey, TEST_VIEWER_KEY),
        ),
      );
    expect(viewRows).toHaveLength(1);
    expect(viewRows[0].count).toBe(1);

    const [provider] = await db
      .select({ profileViews: providers.profileViews })
      .from(providers)
      .where(eq(providers.id, providerId));
    expect(Number(provider.profileViews)).toBe(1);
  });

  it("reuses one thread when concurrent callers start the same conversation", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, () => storage.getOrCreateThread(TEST_USER_ID, providerId)),
    );

    expect(new Set(results.map((thread) => thread.id)).size).toBe(1);
    expect(results.every((thread) => thread.parentUserId === TEST_USER_ID && thread.providerId === providerId)).toBe(true);

    const savedThreads = await db
      .select()
      .from(threads)
      .where(and(eq(threads.parentUserId, TEST_USER_ID), eq(threads.providerId, providerId)));
    expect(savedThreads).toHaveLength(1);
  });
});