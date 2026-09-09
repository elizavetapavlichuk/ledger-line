import { pgTable, text, real, integer } from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  amount: real("amount").notNull(),
  type: text("type", { enum: ["expense", "income"] }).notNull(),
  category: text("category").notNull(),
  note: text("note").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  createdAt: text("created_at").notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  parts: text("parts").notNull(), // JSON-encoded UIMessage["parts"]
  createdAt: text("created_at").notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
