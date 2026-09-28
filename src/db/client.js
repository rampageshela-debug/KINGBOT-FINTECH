import pg from "pg";
import { config } from "../config/env.js";
const { Pool } = pg;
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.nodeEnv === "production" ? { rejectUnauthorized: false } : undefined,
  max: 10
});
