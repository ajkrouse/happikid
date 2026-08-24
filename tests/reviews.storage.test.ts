/**
 * Storage integration test — concurrent reviews keep provider aggregates exact.
 */
import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../server/db";
import { providers, users } from "@shared/schema";
import { DatabaseStorage } from "../server/storage";

describe("DatabaseStorage.createReview", () => {
  it("serializes concurrent reviews and stores the exact aggregate", async () => {
    const suffix = randomUUID();
    const userOneId = `review-test-one-${suffix}`;
    const userTwoId = `review-test-two-${suffix}`;
    let providerId: number | undefined;

    try {
      const [provider] = await db.insert(providers).values({
        name: `Review Integrity ${suffix}`,
        address: "1 Test Street",
        borough: "Test Borough",
        city: "Review Test City",
        state: "NY",
        zipCode: "10001",
        type: "daycare",
        ageRangeMin: 0,
        ageRangeMax: 60,
        monthlyPrice: "1000",
      }).returning({ id: providers.id });
      providerId = provider.id;
      await db.insert(users).values([{ id: userOneId }, { id: userTwoId }]);

      const storage = new DatabaseStorage();
      await Promise.all([
        storage.createReview({ providerId, userId: userOneId, rating: 4 }),
        storage.createReview({ providerId, userId: userTwoId, rating: 5 }),
      ]);

      const [updatedProvider] = await db
        .select({ rating: providers.rating, reviewCount: providers.reviewCount })
        .from(providers)
        .where(eq(providers.id, providerId));

      expect(updatedProvider.reviewCount).toBe(2);
      expect(Number(updatedProvider.rating)).toBe(4.5);
    } finally {
      if (providerId) {
        await db.delete(providers).where(eq(providers.id, providerId));
      }
      await db.delete(users).where(eq(users.id, userOneId));
      await db.delete(users).where(eq(users.id, userTwoId));
    }
  });
});