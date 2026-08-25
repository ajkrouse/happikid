import { pool } from "../db";
import { runMigrations } from "./migrate";

async function main(): Promise<void> {
  try {
    await runMigrations();
  } catch (err) {
    console.error("Migration failed:", err instanceof Error ? err.message : "Unknown migration error");
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();