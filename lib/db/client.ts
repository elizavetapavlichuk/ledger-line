import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add a Postgres connection string to .env.local " +
      "(see README.md — Vercel's Postgres storage integration provides one).",
  );
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
