import { z } from "zod";

const databaseEnvironmentSchema = z.object({
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(20),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(300_000).default(30_000),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(500).max(60_000).default(2_000),
});

export interface DatabaseConfig {
  connectionString: string;
  poolMax: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
}

export class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(`Invalid database configuration: ${message}`);
    this.name = "DatabaseConfigError";
  }
}

function validateConnectionString(connectionString: string): void {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new DatabaseConfigError("DATABASE_URL must be a valid PostgreSQL connection string");
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new DatabaseConfigError("DATABASE_URL must use the postgres:// or postgresql:// scheme");
  }
  if (!parsed.hostname) {
    throw new DatabaseConfigError("DATABASE_URL must include a database host");
  }
}

export function readDatabaseConfig(environment: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const result = databaseEnvironmentSchema.safeParse({
    DATABASE_URL: environment.DATABASE_URL,
    DB_POOL_MAX: environment.DB_POOL_MAX,
    DB_IDLE_TIMEOUT_MS: environment.DB_IDLE_TIMEOUT_MS,
    DB_CONNECTION_TIMEOUT_MS: environment.DB_CONNECTION_TIMEOUT_MS,
  });

  if (!result.success) {
    const issue = result.error.issues[0];
    throw new DatabaseConfigError(`${issue.path.join(".") || "configuration"} ${issue.message}`);
  }

  validateConnectionString(result.data.DATABASE_URL);
  return {
    connectionString: result.data.DATABASE_URL,
    poolMax: result.data.DB_POOL_MAX,
    idleTimeoutMs: result.data.DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMs: result.data.DB_CONNECTION_TIMEOUT_MS,
  };
}
