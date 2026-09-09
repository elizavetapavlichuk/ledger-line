import { NextResponse } from "next/server";
import { deleteLastTransaction, getCurrency, listTransactions, setCurrency } from "@/lib/db/queries";

export async function GET() {
  const [transactions, currency] = await Promise.all([listTransactions(), getCurrency()]);
  return NextResponse.json({ transactions, currency });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const currency = body?.currency;
  if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
    return NextResponse.json({ error: "currency must be a 3-letter code" }, { status: 400 });
  }
  await setCurrency(currency);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const voided = await deleteLastTransaction();
  return NextResponse.json({ ok: true, voided });
}
