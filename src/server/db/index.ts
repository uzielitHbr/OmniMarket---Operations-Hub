import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://mock_user:mock_password@localhost:5432/omnimarket_mock";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export * from "./schema";
