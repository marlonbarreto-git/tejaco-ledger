import { NextRequest, NextResponse } from "next/server";
import { transactions, users } from "@/lib/seed-data";
import { calculateBalances } from "@/lib/balance-engine";
import { Currency } from "@/lib/types";

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
  const homeCurrency = (searchParams.get("homeCurrency") as Currency) || user.homeCurrency;

  const userTransactions = transactions.filter((t) => t.userId === userId);
  const balances = calculateBalances(userTransactions, homeCurrency);

  return NextResponse.json(balances);
}
