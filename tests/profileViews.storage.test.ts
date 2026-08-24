/**
 * Storage unit tests — daily profile views must not drift from provider totals.
 *
 * The insert and counter update intentionally share one transaction, so a
 * failed counter update rolls back the unique view row and lets a retry count
 * the view instead of permanently undercounting it.
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

describe("DatabaseStorage.trackProfileView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts a first daily view and increments its provider counter in one transaction", async () => {
    const counterWhere = vi.fn().mockResolvedValue(undefined);
    const counterSet = vi.fn(() => ({ where: counterWhere }));
    const returning = vi.fn().mockResolvedValue([{ id: 1 }]);
    const onConflictDoNothing = vi.fn(() => ({ returning }));
    const values = vi.fn(() => ({ onConflictDoNothing }));
    const tx = {
      insert: vi.fn(() => ({ values })),
      update: vi.fn(() => ({ set: counterSet })),
    };
    mockedDb.transaction.mockImplementation(async (work: (transaction: typeof tx) => unknown) => work(tx));

    await expect(new DatabaseStorage().trackProfileView(7, "a".repeat(64))).resolves.toBe(true);

    expect(mockedDb.transaction).toHaveBeenCalledTimes(1);
    expect(counterWhere).toHaveBeenCalledTimes(1);
  });

  it("does not increment the provider counter for a repeated daily view", async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const onConflictDoNothing = vi.fn(() => ({ returning }));
    const values = vi.fn(() => ({ onConflictDoNothing }));
    const tx = {
      insert: vi.fn(() => ({ values })),
      update: vi.fn(),
    };
    mockedDb.transaction.mockImplementation(async (work: (transaction: typeof tx) => unknown) => work(tx));

    await expect(new DatabaseStorage().trackProfileView(7, "a".repeat(64))).resolves.toBe(false);

    expect(tx.update).not.toHaveBeenCalled();
  });

  it("propagates a counter failure so the surrounding transaction rolls back the new view", async () => {
    const counterWhere = vi.fn().mockRejectedValue(new Error("counter update failed"));
    const counterSet = vi.fn(() => ({ where: counterWhere }));
    const returning = vi.fn().mockResolvedValue([{ id: 1 }]);
    const onConflictDoNothing = vi.fn(() => ({ returning }));
    const values = vi.fn(() => ({ onConflictDoNothing }));
    const tx = {
      insert: vi.fn(() => ({ values })),
      update: vi.fn(() => ({ set: counterSet })),
    };
    mockedDb.transaction.mockImplementation(async (work: (transaction: typeof tx) => unknown) => work(tx));

    await expect(new DatabaseStorage().trackProfileView(7, "a".repeat(64)))
      .rejects.toThrow("counter update failed");
  });
});