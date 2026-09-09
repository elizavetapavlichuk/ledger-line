import { getCurrency, listMessages, listTransactions } from "@/lib/db/queries";
import LedgerApp from "@/components/LedgerApp";

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
