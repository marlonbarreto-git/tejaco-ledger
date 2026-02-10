"use client";

import { useState } from "react";
import {
  TimelineEntry,
  Currency,
  TransactionState,
  TransactionType,
} from "@/lib/types";
import { formatCurrency } from "@/lib/exchange-rates";

export interface TransactionFilters {
  currency?: Currency;
  state?: TransactionState;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
}

interface TransactionTimelineProps {
  timeline: TimelineEntry[];
  onFilterChange: (filters: TransactionFilters) => void;
}

const ALL_CURRENCIES: Currency[] = [
  "SGD",
  "PHP",
  "MYR",
  "IDR",
  "THB",
  "VND",
  "USD",
];
const ALL_STATES: TransactionState[] = [
  "initiated",
  "processing",
  "completed",
  "failed",
  "refunded",
];
const ALL_TYPES: TransactionType[] = [
  "send",
  "receive",
  "conversion",
  "fee",
  "refund",
  "deposit",
];

const TYPE_COLORS: Record<TransactionType, string> = {
  receive: "bg-green-100 text-green-800",
  deposit: "bg-green-100 text-green-800",
  refund: "bg-green-100 text-green-800",
  send: "bg-red-100 text-red-800",
  fee: "bg-red-100 text-red-800",
  conversion: "bg-blue-100 text-blue-800",
};

const TYPE_ICONS: Record<TransactionType, string> = {
  receive: "\u2193",
  deposit: "\u2193",
  refund: "\u21A9",
  send: "\u2191",
  fee: "\u2217",
  conversion: "\u21C4",
};

const STATE_COLORS: Record<TransactionState, string> = {
  completed: "bg-green-100 text-green-700",
  processing: "bg-amber-100 text-amber-700",
  initiated: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

const DOT_COLORS: Record<TransactionType, string> = {
  receive: "bg-green-500",
  deposit: "bg-green-500",
  refund: "bg-green-500",
  send: "bg-red-500",
  fee: "bg-red-500",
  conversion: "bg-blue-500",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransactionTimeline({
  timeline,
  onFilterChange,
}: TransactionTimelineProps) {
  const [filters, setFilters] = useState<TransactionFilters>({});

  function updateFilter(patch: Partial<TransactionFilters>) {
    const next = { ...filters, ...patch };
    // Remove undefined/empty values
    for (const key of Object.keys(next) as (keyof TransactionFilters)[]) {
      if (next[key] === "" || next[key] === undefined) {
        delete next[key];
      }
    }
    setFilters(next);
    onFilterChange(next);
  }

  return (
    <div className="w-full">
      {/* Filter Bar */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Currency */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              Currency
            </label>
            <select
              value={filters.currency ?? ""}
              onChange={(e) =>
                updateFilter({
                  currency: (e.target.value || undefined) as
                    | Currency
                    | undefined,
                })
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All currencies</option>
              {ALL_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">State</label>
            <select
              value={filters.state ?? ""}
              onChange={(e) =>
                updateFilter({
                  state: (e.target.value || undefined) as
                    | TransactionState
                    | undefined,
                })
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All states</option>
              {ALL_STATES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Type</label>
            <select
              value={filters.type ?? ""}
              onChange={(e) =>
                updateFilter({
                  type: (e.target.value || undefined) as
                    | TransactionType
                    | undefined,
                })
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All types</option>
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">From</label>
            <input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) =>
                updateFilter({ dateFrom: e.target.value || undefined })
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">To</label>
            <input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) =>
                updateFilter({ dateTo: e.target.value || undefined })
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Clear filters */}
          {Object.keys(filters).length > 0 && (
            <button
              onClick={() => {
                setFilters({});
                onFilterChange({});
              }}
              className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {timeline.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          No transactions to display.
        </div>
      ) : (
        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />

          {timeline.map((entry, idx) => {
            const tx = entry.transaction;
            const isLast = idx === timeline.length - 1;

            return (
              <div
                key={tx.id}
                className={`group relative flex gap-4 ${isLast ? "" : "pb-6"}`}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute left-[-20px] top-1 z-10 h-3 w-3 rounded-full ring-2 ring-white ${DOT_COLORS[tx.type]}`}
                />

                {/* Card */}
                <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
                  {/* Top row: date + type badge + state badge */}
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {formatDate(tx.createdAt)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[tx.type]}`}
                    >
                      <span>{TYPE_ICONS[tx.type]}</span>
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_COLORS[tx.state]}`}
                    >
                      {tx.state.charAt(0).toUpperCase() + tx.state.slice(1)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mb-2 text-sm text-gray-700">{tx.description}</p>

                  {/* Amount row */}
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span className="text-gray-900">
                      {formatCurrency(tx.sourceAmount, tx.sourceCurrency)}
                    </span>
                    {tx.destinationCurrency &&
                      tx.destinationAmount !== undefined && (
                        <>
                          <span className="text-gray-400">&rarr;</span>
                          <span className="text-gray-900">
                            {formatCurrency(
                              tx.destinationAmount,
                              tx.destinationCurrency
                            )}
                          </span>
                        </>
                      )}
                    {tx.exchangeRate !== undefined && (
                      <span className="text-xs text-gray-400">
                        (rate: {tx.exchangeRate.toFixed(4)})
                      </span>
                    )}
                  </div>

                  {/* Balance impact */}
                  {entry.balanceImpact.length > 0 && (
                    <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-2">
                      {entry.balanceImpact.map((impact, i) => (
                        <span
                          key={i}
                          className={`text-xs font-medium ${
                            impact.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {impact.type === "credit" ? "+" : "-"}
                          {formatCurrency(
                            Math.abs(impact.amount),
                            impact.currency
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
