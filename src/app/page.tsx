"use client";

import { useState, useEffect, useCallback } from "react";
import { User, BalanceSummary, TimelineEntry, Currency } from "@/lib/types";
import BalanceCards from "@/components/BalanceCards";
import TransactionTimeline, {
  TransactionFilters,
} from "@/components/TransactionTimeline";

const CURRENCIES: Currency[] = ["SGD", "PHP", "MYR", "IDR", "THB", "VND", "USD"];

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [balance, setBalance] = useState<BalanceSummary | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [showInHomeCurrency, setShowInHomeCurrency] = useState(false);
  const [homeCurrency, setHomeCurrency] = useState<Currency | "">("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({});

  // Fetch users on mount
  useEffect(() => {
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data: User[]) => {
        setUsers(data);
        if (data.length > 0) {
          setSelectedUserId(data[0].id);
          setHomeCurrency(data[0].homeCurrency);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingUsers(false));
  }, []);

  // Fetch balance when user or homeCurrency changes
  useEffect(() => {
    if (!selectedUserId) return;
    setLoadingBalance(true);
    const params = new URLSearchParams();
    if (homeCurrency) params.set("homeCurrency", homeCurrency);

    fetch(`/api/users/${selectedUserId}/balance?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch balance");
        return res.json();
      })
      .then((data: BalanceSummary) => setBalance(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingBalance(false));
  }, [selectedUserId, homeCurrency]);

  // Fetch timeline when user or filters change
  const fetchTimeline = useCallback(() => {
    if (!selectedUserId) return;
    setLoadingTimeline(true);
    const params = new URLSearchParams();
    if (filters.currency) params.set("currency", filters.currency);
    if (filters.state) params.set("state", filters.state);
    if (filters.type) params.set("type", filters.type);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);

    fetch(`/api/users/${selectedUserId}/transactions?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch transactions");
        return res.json();
      })
      .then((data: TimelineEntry[]) => setTimeline(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingTimeline(false));
  }, [selectedUserId, filters]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // When user changes, update homeCurrency to their default
  function handleUserChange(userId: string) {
    setSelectedUserId(userId);
    const user = users.find((u) => u.id === userId);
    if (user) setHomeCurrency(user.homeCurrency);
    setFilters({});
  }

  function handleFiltersChange(newFilters: TransactionFilters) {
    setFilters(newFilters);
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-lg font-semibold text-red-800">Something went wrong</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loadingUsers) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="mt-4 text-sm text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">TejaCo</h1>
          <p className="mt-1 text-sm text-indigo-200">Multi-Currency Balance Engine</p>
        </div>
      </header>

      {/* Controls */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          {/* User selector */}
          <div className="flex-1 min-w-48">
            <label
              htmlFor="user-select"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Select User
            </label>
            <select
              id="user-select"
              value={selectedUserId}
              onChange={(e) => handleUserChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.homeCurrency})
                </option>
              ))}
            </select>
          </div>

          {/* Home currency selector */}
          <div className="min-w-36">
            <label
              htmlFor="currency-select"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Home Currency
            </label>
            <select
              id="currency-select"
              value={homeCurrency}
              onChange={(e) => setHomeCurrency(e.target.value as Currency)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Show in home currency toggle */}
          <div className="flex items-center gap-3 pt-4">
            <button
              role="switch"
              aria-checked={showInHomeCurrency}
              onClick={() => setShowInHomeCurrency(!showInHomeCurrency)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                showInHomeCurrency ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                  showInHomeCurrency ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              Show in home currency
            </span>
          </div>
        </div>

        {/* Balance Section */}
        <section className="mt-8">
          {loadingBalance ? (
            <div className="space-y-6">
              <div className="h-32 animate-pulse rounded-2xl bg-gray-200" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200" />
                ))}
              </div>
            </div>
          ) : balance ? (
            <BalanceCards
              balances={balance.balances}
              totalInHomeCurrency={balance.totalInHomeCurrency}
              homeCurrency={balance.homeCurrency}
              showInHomeCurrency={showInHomeCurrency}
            />
          ) : null}
        </section>

        {/* Transaction Timeline Section */}
        <section className="mt-8 pb-16">
          {loadingTimeline && timeline.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : (
            <TransactionTimeline
              timeline={timeline}
              onFilterChange={handleFiltersChange}
            />
          )}
        </section>
      </div>
    </div>
  );
}
