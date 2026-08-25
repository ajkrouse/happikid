import { describe, expect, it, vi } from "vitest";
import { startAfterMigrations } from "../server/startup/releaseBootstrap";

describe("release bootstrap", () => {
  it("runs migrations before importing and starting the server", async () => {
    const order: string[] = [];

    await startAfterMigrations({
      migrate: async () => { order.push("migrate"); },
      startServer: async () => { order.push("listen"); },
    });

    expect(order).toEqual(["migrate", "listen"]);
  });

  it("does not start the server when migrations fail", async () => {
    const startServer = vi.fn();

    await expect(startAfterMigrations({
      migrate: async () => { throw new Error("schema is outdated"); },
      startServer,
    })).rejects.toThrow("schema is outdated");

    expect(startServer).not.toHaveBeenCalled();
  });
});