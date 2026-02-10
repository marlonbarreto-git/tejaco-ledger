import { NextRequest, NextResponse } from "next/server";
import { transactions, users } from "@/lib/seed-data";
import { buildTimeline } from "@/lib/balance-engine";
import { Currency, TransactionState, TransactionType } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const currency = searchParams.get("currency") as Currency | null;
  const state = searchParams.get("state") as TransactionState | null;
  const type = searchParams.get("type") as TransactionType | null;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  let userTransactions = transactions.filter((t) => t.userId === userId);

  // Apply filters
  if (currency) {
    userTransactions = userTransactions.filter(
      (t) => t.sourceCurrency === currency || t.destinationCurrency === currency
    );
  }
  if (state) {
    userTransactions = userTransactions.filter((t) => t.state === state);
  }
  if (type) {
    userTransactions = userTransactions.filter((t) => t.type === type);
  }
  if (dateFrom) {
    userTransactions = userTransactions.filter(
      (t) => new Date(t.createdAt) >= new Date(dateFrom)
    );
  }
  if (dateTo) {
    userTransactions = userTransactions.filter(
      (t) => new Date(t.createdAt) <= new Date(dateTo)
    );
  }

  const timeline = buildTimeline(userTransactions, user.homeCurrency);

  return NextResponse.json(timeline);
}
