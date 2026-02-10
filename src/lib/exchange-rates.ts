import { Currency } from "./types";

// Exchange rates relative to USD (base currency for conversion)
// These simulate rates that change over time
const baseRates: Record<Currency, number> = {
  USD: 1.0,
  SGD: 0.74,
  PHP: 0.018,
  MYR: 0.22,
  IDR: 0.000063,
  THB: 0.028,
  VND: 0.000040,
};

// Simulated historical rate variations (multiplier applied to base)
const rateVariations: Record<string, number> = {
  "2025-01": 1.0,
  "2025-02": 1.005,
  "2025-03": 0.998,
  "2025-04": 1.012,
  "2025-05": 0.995,
  "2025-06": 1.008,
};

export function getExchangeRate(
  from: Currency,
  to: Currency,
  date?: string
): number {
  if (from === to) return 1;

  let variation = 1.0;
  if (date) {
    const monthKey = date.substring(0, 7);
    variation = rateVariations[monthKey] || 1.0;
  }

  const fromUsd = baseRates[from] * variation;
  const toUsd = baseRates[to] * variation;

  return fromUsd / toUsd;
}

export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  date?: string
): number {
  const rate = getExchangeRate(from, to, date);
  return Math.round(amount * rate * 100) / 100;
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: "$",
    SGD: "S$",
    PHP: "₱",
    MYR: "RM",
    IDR: "Rp",
    THB: "฿",
    VND: "₫",
  };

  const decimals = ["IDR", "VND"].includes(currency) ? 0 : 2;

  return `${symbols[currency]}${amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
