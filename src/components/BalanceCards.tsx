"use client";

import { CurrencyBalance, Currency } from "@/lib/types";
import { formatCurrency, convertAmount } from "@/lib/exchange-rates";

interface BalanceCardsProps {
  balances: CurrencyBalance[];
  totalInHomeCurrency: number;
  homeCurrency: Currency;
  showInHomeCurrency: boolean;
}

const FLAGS: Record<Currency, string> = {
  SGD: "\u{1F1F8}\u{1F1EC}",
  PHP: "\u{1F1F5}\u{1F1ED}",
  MYR: "\u{1F1F2}\u{1F1FE}",
  IDR: "\u{1F1EE}\u{1F1E9}",
  THB: "\u{1F1F9}\u{1F1ED}",
  VND: "\u{1F1FB}\u{1F1F3}",
  USD: "\u{1F1FA}\u{1F1F8}",
};

function displayAmount(
  amount: number,
  currency: Currency,
  homeCurrency: Currency,
  showInHomeCurrency: boolean
): string {
  if (showInHomeCurrency && currency !== homeCurrency) {
    const converted = convertAmount(amount, currency, homeCurrency);
    return formatCurrency(converted, homeCurrency);
  }
  return formatCurrency(amount, currency);
}

export default function BalanceCards({
  balances,
  totalInHomeCurrency,
  homeCurrency,
  showInHomeCurrency,
}: BalanceCardsProps) {
  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 p-6 text-white shadow-lg">
        <p className="text-sm font-medium text-indigo-100">Total Balance</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">
          {formatCurrency(totalInHomeCurrency, homeCurrency)}
        </p>
        <p className="mt-1 text-sm text-indigo-200">
          {balances.length} {balances.length === 1 ? "currency" : "currencies"}{" "}
          &middot; {homeCurrency}
        </p>
      </div>

      {/* Individual Currency Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {balances.map((balance) => (
          <div
            key={balance.currency}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{FLAGS[balance.currency]}</span>
                <span className="text-sm font-semibold text-gray-700">
                  {balance.currency}
                </span>
              </div>
              {balance.pending > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                </span>
              )}
            </div>

            {/* Available */}
            <div className="mb-2 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
              <span className="text-xs font-medium text-green-700">
                Available
              </span>
              <span className="text-sm font-semibold text-green-800">
                {displayAmount(
                  balance.available,
                  balance.currency,
                  homeCurrency,
                  showInHomeCurrency
                )}
              </span>
            </div>

            {/* Pending */}
            <div className="mb-3 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
              <span className="text-xs font-medium text-amber-700">
                Pending
              </span>
              <span className="text-sm font-semibold text-amber-800">
                {displayAmount(
                  balance.pending,
                  balance.currency,
                  homeCurrency,
                  showInHomeCurrency
                )}
              </span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-xs font-medium text-gray-500">Total</span>
              <span className="text-base font-bold text-gray-900">
                {displayAmount(
                  balance.total,
                  balance.currency,
                  homeCurrency,
                  showInHomeCurrency
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
