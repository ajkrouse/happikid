import { describe, expect, it } from "vitest";
import { DatabaseConfigError, readDatabaseConfig } from "../server/config/database";

const validEnvironment = {
  DATABASE_URL: "postgresql://user:password@db.example.test:5432/happikid",
  NODE_ENV: "test",
};

describe("database configuration", () => {
  it("uses validated defaults for the shared pool settings", () => {
    expect(readDatabaseConfig(validEnvironment)).toMatchObject({
      connectionString: validEnvironment.DATABASE_URL,
      poolMax: 20,
      idleTimeoutMs: 30_000,
      connectionTimeoutMs: 2_000,
    });
  });

  it("accepts bounded overrides and coerces numeric environment values", () => {
    expect(readDatabaseConfig({
      ...validEnvironment,
      DB_POOL_MAX: "12",
      DB_IDLE_TIMEOUT_MS: "60000",
      DB_CONNECTION_TIMEOUT_MS: "5000",
    })).toMatchObject({
      poolMax: 12,
      idleTimeoutMs: 60_000,
      connectionTimeoutMs: 5_000,
    });
  });

  it.each([
    [{}, "DATABASE_URL"],
    [{ DATABASE_URL: "https://example.test/db" }, "postgres://"],
    [{ ...validEnvironment, DB_POOL_MAX: "0" }, "DB_POOL_MAX"],
    [{ ...validEnvironment, DB_POOL_MAX: "51" }, "DB_POOL_MAX"],
    [{ ...validEnvironment, DB_IDLE_TIMEOUT_MS: "999" }, "DB_IDLE_TIMEOUT_MS"],
    [{ ...validEnvironment, DB_CONNECTION_TIMEOUT_MS: "100" }, "DB_CONNECTION_TIMEOUT_MS"],
  ])("rejects an invalid configuration %#", (environment, expectedMessage) => {
    expect(() => readDatabaseConfig(environment)).toThrow(DatabaseConfigError);
    expect(() => readDatabaseConfig(environment)).toThrow(expectedMessage);
  });

});