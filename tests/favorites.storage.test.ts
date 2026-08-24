/**
 * Storage unit tests — favorite writes must be idempotent under retries.
 *
 * The database transaction is mocked so these tests focus on the write
 * protocol: only an inserted bookmark increments provider analytics, while a
 * conflict returns the existing bookmark unchanged.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedDb = vi.hoisted(() => ({
  transaction: vi.fn(),
}));

vi.mock("../server/db", () => ({
  db: mockedDb,
}));

vi.mock("../server/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { DatabaseStorage } from "../server/storage";

const favorite = {
  userId: "parent-1",
  providerId: 7,
  createdAt: new Date("2026-08-24T00:00:00.000Z"),
};

describe("DatabaseStorage.addFavorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts once and increments favoriteAdds only for the newly created bookmark", async () => {
    const counterWhere = vi.fn().mockResolvedValue(undefined);
    const counterSet = vi.fn(() => ({ where: counterWhere }));
    const returning = vi.fn().mockResolvedValue([favorite]);
    const onConflictDoNothing = vi.fn(() => ({ returning }));
    const values = vi.fn(() => ({ onConflictDoNothing }));
    const tx = {
      insert: vi.fn(() => ({ values })),
      update: vi.fn(() => ({ set: counterSet })),
    };
    mockedDb.transaction.mockImplementation(async (work: (transaction: typeof tx) => unknown) => work(tx));

    await expect(new DatabaseStorage().addFavorite("parent-1", 7)).resolves.toEqual({
      favorite,
      created: true,
    });

    expect(onConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(tx.update).toHaveBeenCalledTimes(1);
    expect(counterWhere).toHaveBeenCalledTimes(1);
  });

  it("returns the existing bookmark after a conflict without incrementing favoriteAdds", async () => {
    const existingWhere = vi.fn().mockResolvedValue([favorite]);
    const existingFrom = vi.fn(() => ({ where: existingWhere }));
    const returning = vi.fn().mockResolvedValue([]);
    const onConflictDoNothing = vi.fn(() => ({ returning }));
    const values = vi.fn(() => ({ onConflictDoNothing }));
    const tx = {
      insert: vi.fn(() => ({ values })),
      select: vi.fn(() => ({ from: existingFrom })),
      update: vi.fn(),
    };
    mockedDb.transaction.mockImplementation(async (work: (transaction: typeof tx) => unknown) => work(tx));

    await expect(new DatabaseStorage().addFavorite("parent-1", 7)).resolves.toEqual({
      favorite,
      created: false,
    });

    expect(onConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(existingWhere).toHaveBeenCalledTimes(1);
    expect(tx.update).not.toHaveBeenCalled();
  });
});