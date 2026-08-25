import { migrate } from "drizzle-orm/neon-serverless/migrator";
import path from "path";
import { fileURLToPath } from "url";
import { db, pool } from "../db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../migrations");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  console.log("Running database migrations from:", migrationsFolder);
  await migrate(db, { migrationsFolder });
  await pool.end();
  console.log("Migrations complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
