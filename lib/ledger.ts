export const CATEGORIES = [
  "Food & Drink",
  "Transport",
  "Housing",
  "Utilities",
  "Shopping",
  "Health",
  "Entertainment",
  "Travel",
  "Income",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type TransactionType = "expense" | "income";

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
  /** YYYY-MM-DD */
  date: string;
  createdAt: string;
}

export const CURRENCIES: [code: string, label: string][] = [
  ["USD", "US Dollar"],
  ["EUR", "Euro"],
  ["GBP", "British Pound"],
  ["RUB", "Russian Ruble"],
  ["UAH", "Ukrainian Hryvnia"],
  ["PLN", "Polish Zloty"],
  ["JPY", "Japanese Yen"],
  ["CNY", "Chinese Yuan"],
  ["INR", "Indian Rupee"],
  ["CAD", "Canadian Dollar"],
  ["AUD", "Australian Dollar"],
  ["TRY", "Turkish Lira"],
  ["BRL", "Brazilian Real"],
  ["CHF", "Swiss Franc"],
];

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function monthPrefix(): string {
  return todayISO().slice(0, 7);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    // A fixed locale (rather than the visitor's) keeps server- and
    // client-rendered output identical, avoiding a hydration mismatch.
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export interface LedgerSummary {
  period: "today" | "week" | "month" | "all";
  currency: string;
  totalExpense: number;
  totalIncome: number;
  entryCount: number;
  byCategory: { category: string; total: number }[];
}

export function computeSummary(
  transactions: Transaction[],
  period: LedgerSummary["period"],
  currency: string,
): LedgerSummary {
  let cutoff: string | null = null;
  if (period === "today") cutoff = todayISO();
  if (period === "week") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    cutoff = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  if (period === "month") cutoff = `${monthPrefix()}-01`;

  const rows = transactions.filter((t) => {
    if (period === "all") return true;
    return cutoff !== null && t.date >= cutoff;
  });

  let totalExpense = 0;
  let totalIncome = 0;
  const byCategory: Record<string, number> = {};

  for (const t of rows) {
    if (t.type === "income") {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }
  }

  const categoryList = Object.entries(byCategory)
    .map(([category, total]) => ({ category, total: round2(total) }))
    .sort((a, b) => b.total - a.total);

  return {
    period,
    currency,
    totalExpense: round2(totalExpense),
    totalIncome: round2(totalIncome),
    entryCount: rows.length,
    byCategory: categoryList,
  };
}
