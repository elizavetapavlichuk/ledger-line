import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  amount: real("amount").notNull(),
  type: text("type", { enum: ["expense", "income"] }).notNull(),
  category: text("category").notNull(),
  note: text("note").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  createdAt: text("created_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  parts: text("parts").notNull(), // JSON-encoded UIMessage["parts"]
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
