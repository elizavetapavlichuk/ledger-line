import { getCurrency, listMessages, listTransactions } from "@/lib/db/queries";
import LedgerApp from "@/components/LedgerApp";

// Without this, Next has no signal that the page depends on live database
// state (a plain DB call isn't a "dynamic API" it recognizes) and will
// prerender one static snapshot at build time instead of querying per request.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [transactions, currency, messages] = await Promise.all([
    listTransactions(),
    getCurrency(),
    listMessages(),
  ]);

  return (
    <LedgerApp initialTransactions={transactions} initialCurrency={currency} initialMessages={messages} />
  );
}
