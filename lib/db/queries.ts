import { desc, asc, eq } from "drizzle-orm";
import type { UIMessage } from "ai";
import { db } from "./client";
import { transactions, messages, settings } from "./schema";
import type { Transaction, TransactionType } from "@/lib/ledger";

const DEFAULT_CURRENCY = "USD";

export async function listTransactions(): Promise<Transaction[]> {
  const rows = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.createdAt));
  return rows as Transaction[];
}

export async function addTransaction(input: {
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
  date: string;
}): Promise<Transaction> {
  const [row] = await db
    .insert(transactions)
    .values({ ...input, createdAt: new Date().toISOString() })
    .returning();
  return row as Transaction;
}

export async function deleteLastTransaction(): Promise<Transaction | null> {
  const [last] = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(1);
  if (!last) return null;
  await db.delete(transactions).where(eq(transactions.id, last.id));
  return last as Transaction;
}

export async function getCurrency(): Promise<string> {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "currency"))
    .limit(1);
  return row?.value ?? DEFAULT_CURRENCY;
}

export async function setCurrency(currency: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key: "currency", value: currency })
    .onConflictDoUpdate({ target: settings.key, set: { value: currency } });
}

export async function listMessages(): Promise<UIMessage[]> {
  const rows = await db.select().from(messages).orderBy(asc(messages.createdAt));
  return rows.map((r) => ({
    id: r.id,
    role: r.role as UIMessage["role"],
    parts: JSON.parse(r.parts) as UIMessage["parts"],
  }));
}

export async function upsertMessages(list: UIMessage[]): Promise<void> {
  const base = Date.now();
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const parts = JSON.stringify(m.parts);
    // Offset by index so messages saved together (a user turn and its
    // reply) keep a stable relative order despite sharing a save moment.
    const createdAt = new Date(base + i).toISOString();
    await db
      .insert(messages)
      .values({ id: m.id, role: m.role, parts, createdAt })
      .onConflictDoUpdate({
        target: messages.id,
        set: { role: m.role, parts },
      });
  }
}
