"use client";

import { useState } from "react";
import type { Transaction } from "@/lib/ledger";
import { computeSummary, formatMoney } from "@/lib/ledger";

export default function LedgerSidebar({
  transactions,
  currency,
  onVoidLast,
}: {
  transactions: Transaction[];
  currency: string;
  onVoidLast: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const summary = computeSummary(transactions, "month", currency);
  const recent = transactions.slice(0, 8);
  const maxCat = summary.byCategory[0]?.total ?? 0;

  function handleVoidClick() {
    if (!armed) {
      setArmed(true);
      window.setTimeout(() => setArmed(false), 3000);
      return;
    }
    setArmed(false);
    onVoidLast();
  }

  return (
    <aside aria-label="Running ledger" className="flex flex-col gap-4.5">
      <div className="rounded-[10px] border border-rule bg-paper-2 px-5 py-4.5 shadow-[0_1px_0_rgba(29,35,30,0.06)]">
        <span className="block font-mono text-[11px] uppercase tracking-[0.07em] text-ink-faint">
          Spent this month
        </span>
        <span className="tabular mt-1 block font-display text-[34px] font-semibold tracking-tight">
          {formatMoney(summary.totalExpense, currency)}
        </span>
        {summary.totalIncome > 0 && (
          <span className="tabular mt-1 block font-mono text-[12.5px] text-income">
            + {formatMoney(summary.totalIncome, currency)} income
          </span>
        )}
      </div>

      <div className="rounded-[10px] border border-rule bg-paper-2 px-5 pb-1.5 pt-4 shadow-[0_1px_0_rgba(29,35,30,0.06)]">
        <div className="mb-2.5 flex items-baseline justify-between border-b border-rule pb-2">
          <h2 className="text-[14.5px] font-semibold">By category</h2>
        </div>
        <ul className="pb-2">
          {summary.byCategory.length === 0 ? (
            <li className="py-3.5 font-display text-[13px] italic text-ink-faint">
              Nothing logged yet this month.
            </li>
          ) : (
            summary.byCategory.map((row) => (
              <li key={row.category} className="border-b border-rule py-2 last:border-none">
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span>{row.category}</span>
                  <span className="tabular font-mono text-[12.5px]">{formatMoney(row.total, currency)}</span>
                </div>
                <div className="h-[5px] overflow-hidden rounded-[3px] bg-paper-3">
                  <div
                    className="h-full rounded-[3px] bg-accent"
                    style={{ width: `${maxCat ? Math.max(4, Math.round((row.total / maxCat) * 100)) : 0}%` }}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-[10px] border border-rule bg-paper-2 px-5 pb-1.5 pt-4 shadow-[0_1px_0_rgba(29,35,30,0.06)]">
        <div className="mb-2.5 flex items-baseline justify-between border-b border-rule pb-2">
          <h2 className="text-[14.5px] font-semibold">Recent entries</h2>
          <button
            type="button"
            disabled={transactions.length === 0}
            onClick={handleVoidClick}
            className={`rounded-[5px] border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.03em] disabled:opacity-40 ${
              armed
                ? "border-expense bg-accent-soft text-expense"
                : "border-rule-strong text-ink-dim hover:border-expense hover:text-expense"
            }`}
          >
            {armed ? "Confirm void?" : "Void last"}
          </button>
        </div>
        <ul className="pb-2">
          {recent.length === 0 ? (
            <li className="py-3.5 font-display text-[13px] italic text-ink-faint">
              No entries yet — start the conversation.
            </li>
          ) : (
            recent.map((t) => (
              <li
                key={t.id}
                className="grid grid-cols-[44px_1fr_auto] items-baseline gap-2.5 border-b border-rule py-2 text-[13px] last:border-none"
              >
                <span className="tabular font-mono text-[11.5px] text-ink-faint">
                  {t.date.slice(5).replace("-", "/")}
                </span>
                <span className="min-w-0">
                  <span className="block text-[10.5px] uppercase tracking-[0.05em] text-ink-faint">
                    {t.category}
                  </span>
                  <span className="block truncate">{t.note}</span>
                </span>
                <span
                  className={`tabular whitespace-nowrap font-mono text-[13px] font-medium ${
                    t.type === "income" ? "text-income" : "text-expense"
                  }`}
                >
                  {t.type === "income" ? "+" : "−"} {formatMoney(t.amount, currency)}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
}
