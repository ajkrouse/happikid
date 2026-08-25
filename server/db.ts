import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { readDatabaseConfig } from "./config/database";

neonConfig.webSocketConstructor = ws;

export const databaseConfig = readDatabaseConfig();

export const pool = new Pool({ 
  connectionString: databaseConfig.connectionString,
  max: databaseConfig.poolMax,
  idleTimeoutMillis: databaseConfig.idleTimeoutMs,
  connectionTimeoutMillis: databaseConfig.connectionTimeoutMs,
});

export const db = drizzle({ client: pool, schema });