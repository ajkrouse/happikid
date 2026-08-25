import { startAfterMigrations } from "./startup/releaseBootstrap";
import { pool } from "./db";

void startAfterMigrations().catch(async (error) => {
  const message = error instanceof Error ? error.message : "Unknown migration error";
  console.error(`Release blocked: database migrations did not complete (${message})`);
  await pool.end().catch(() => undefined);
  process.exitCode = 1;
});