import fs from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs as its own CLI process, outside Next.js, so it never
// gets Next's automatic .env.local loading — load it ourselves.
if (fs.existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — add it to .env.local before running drizzle-kit.");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
