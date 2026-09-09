"use client";

import { useCallback, useEffect, useState } from "react";
import type { UIMessage } from "ai";
import type { Transaction } from "@/lib/ledger";
import { CURRENCIES } from "@/lib/ledger";
import ChatPanel from "./ChatPanel";
import LedgerSidebar from "./LedgerSidebar";

export default function LedgerApp({
  initialTransactions,
  initialCurrency,
  initialMessages,
}: {
  initialTransactions: Transaction[];
  initialCurrency: string;
  initialMessages: UIMessage[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [currency, setCurrencyState] = useState(initialCurrency);

  // Formatted client-side only: Node's Intl output for the same locale
  // can differ subtly from the browser's, which would otherwise trip a
  // hydration mismatch on this text. Deliberately deferred to an effect
  // rather than derived at render time, for that reason.
  const [today, setToday] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from the browser's own Intl output, not derivable during SSR render
    setToday(new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }));
  }, []);

  const refreshLedger = useCallback(async () => {
    try {
      const res = await fetch("/api/ledger");
      if (!res.ok) return;
      const data = await res.json();
      setTransactions(data.transactions);
      setCurrencyState(data.currency);
    } catch {
      // A transient failure just means the sidebar stays stale until the next refresh.
    }
  }, []);

  async function handleCurrencyChange(next: string) {
    setCurrencyState(next);
    await fetch("/api/ledger", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: next }),
    }).catch(() => {});
  }

  async function handleVoidLast() {
    await fetch("/api/ledger", { method: "DELETE" }).catch(() => {});
    refreshLedger();
  }

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-12 pt-7">
      <header className="mb-5.5 flex flex-wrap items-end justify-between gap-6 border-b-2 border-ink pb-4.5">
        <div className="flex items-center gap-3.5">
          <div
            aria-hidden
            className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full border-[1.5px] border-ink font-display text-[34px] font-medium leading-none"
          >
            §
          </div>
          <div>
            <h1 className="text-[27px] font-semibold tracking-tight">Ledger Line</h1>
            <p className="mt-0.5 font-display text-[13.5px] italic text-ink-dim">
              Tell it what you spent. It keeps the books.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4.5 font-mono text-[12.5px] text-ink-dim">
          <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em]">
            Currency
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="rounded border border-rule-strong bg-paper-2 px-1.5 py-1 font-mono text-[12.5px] text-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              {CURRENCIES.map(([code, label]) => (
                <option key={code} value={code}>
                  {code} — {label}
                </option>
              ))}
            </select>
          </label>
          <span className="tabular whitespace-nowrap uppercase tracking-[0.06em]">{today}</span>
        </div>
      </header>

      <main className="grid items-start gap-7 md:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]">
        <ChatPanel initialMessages={initialMessages} onTurnFinished={refreshLedger} />
        <LedgerSidebar transactions={transactions} currency={currency} onVoidLast={handleVoidLast} />
      </main>
    </div>
  );
}
