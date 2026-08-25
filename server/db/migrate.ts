import { migrate } from "drizzle-orm/neon-serverless/migrator";
import path from "node:path";
import { db } from "../db";

export const migrationsFolder = path.resolve(process.cwd(), "migrations");

export async function runMigrations(): Promise<void> {
  console.log("Running database migrations from:", migrationsFolder);
  await migrate(db, { migrationsFolder });
  console.log("Migrations complete!");
}
