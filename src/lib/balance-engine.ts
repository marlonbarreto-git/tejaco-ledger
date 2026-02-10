import {
  Transaction,
  Currency,
  CurrencyBalance,
  BalanceSummary,
  TimelineEntry,
} from "./types";
import { convertAmount } from "./exchange-rates";

/**
 * Calculate available, pending, and total balances for a user
 * across all currencies they hold.
 *
 * Rules:
 * - completed deposits/receives/refunds → add to available
 * - completed sends/fees → subtract from available
 * - completed conversions → subtract source from available, add dest to available
 * - processing/initiated sends → subtract from available (held), add to pending
 * - failed/refunded sends → ignored (no balance impact)
 */
export function calculateBalances(
  transactions: Transaction[],
  homeCurrency: Currency
): BalanceSummary {
  const balanceMap: Record<string, { available: number; pending: number }> = {};

  function ensureCurrency(currency: Currency) {
    if (!balanceMap[currency]) {
      balanceMap[currency] = { available: 0, pending: 0 };
    }
  }

  for (const tx of transactions) {
    const { type, state, sourceCurrency, sourceAmount } = tx;

    // Failed transactions have no balance impact
    if (state === "failed") continue;

    switch (type) {
      case "deposit": {
        if (state === "completed") {
          ensureCurrency(sourceCurrency);
          balanceMap[sourceCurrency].available += sourceAmount;
        } else if (state === "processing" || state === "initiated") {
          ensureCurrency(sourceCurrency);
          balanceMap[sourceCurrency].pending += sourceAmount;
        }
        break;
      }

      case "receive": {
        if (state === "completed" && tx.destinationCurrency && tx.destinationAmount) {
          ensureCurrency(tx.destinationCurrency);
          balanceMap[tx.destinationCurrency].available += tx.destinationAmount;
        } else if ((state === "processing" || state === "initiated") && tx.destinationCurrency && tx.destinationAmount) {
          ensureCurrency(tx.destinationCurrency);
          balanceMap[tx.destinationCurrency].pending += tx.destinationAmount;
        }
        break;
      }

      case "refund": {
        if (state === "completed") {
          ensureCurrency(sourceCurrency);
          balanceMap[sourceCurrency].available += sourceAmount;
        }
        break;
      }

      case "send": {
        if (state === "completed") {
          ensureCurrency(sourceCurrency);
          balanceMap[sourceCurrency].available -= sourceAmount;
        } else if (state === "processing" || state === "initiated") {
          // Funds are held from available and shown as pending
          ensureCurrency(sourceCurrency);
          balanceMap[sourceCurrency].available -= sourceAmount;
          balanceMap[sourceCurrency].pending += sourceAmount;
        } else if (state === "refunded") {
          // Refunded sends: the send originally deducted, but the refund tx adds it back
          // So the send itself still counts as a debit
          ensureCurrency(sourceCurrency);
          balanceMap[sourceCurrency].available -= sourceAmount;
        }
        break;
      }

      case "fee": {
        if (state === "completed") {
          ensureCurrency(sourceCurrency);
          balanceMap[sourceCurrency].available -= sourceAmount;
        }
        break;
      }

      case "conversion": {
        if (state === "completed") {
          ensureCurrency(sourceCurrency);
          balanceMap[sourceCurrency].available -= sourceAmount;
          if (tx.destinationCurrency && tx.destinationAmount) {
            ensureCurrency(tx.destinationCurrency);
            balanceMap[tx.destinationCurrency].available += tx.destinationAmount;
          }
        }
        break;
      }
    }
  }

  const balances: CurrencyBalance[] = Object.entries(balanceMap).map(
    ([currency, { available, pending }]) => ({
      currency: currency as Currency,
      available: Math.round(available * 100) / 100,
      pending: Math.round(pending * 100) / 100,
      total: Math.round((available + pending) * 100) / 100,
    })
  );

  // Calculate total in home currency
  let totalInHomeCurrency = 0;
  for (const balance of balances) {
    const totalInHome = convertAmount(
      balance.total,
      balance.currency,
      homeCurrency
    );
    totalInHomeCurrency += totalInHome;
  }
  totalInHomeCurrency = Math.round(totalInHomeCurrency * 100) / 100;

  return {
    balances,
    totalInHomeCurrency,
    homeCurrency,
  };
}

/**
 * Build a transaction timeline with balance impact for each entry
 */
export function buildTimeline(
  transactions: Transaction[],
  homeCurrency: Currency
): TimelineEntry[] {
  // Sort by date ascending
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const runningBalances: Record<string, { available: number; pending: number }> = {};
  const timeline: TimelineEntry[] = [];

  function ensureCurrency(currency: Currency) {
    if (!runningBalances[currency]) {
      runningBalances[currency] = { available: 0, pending: 0 };
    }
  }

  for (const tx of sorted) {
    const impacts: TimelineEntry["balanceImpact"] = [];
    const { type, state, sourceCurrency, sourceAmount } = tx;

    if (state === "failed") {
      timeline.push({
        transaction: tx,
        balanceImpact: [],
        runningBalances: JSON.parse(JSON.stringify(runningBalances)),
      });
      continue;
    }

    switch (type) {
      case "deposit": {
        if (state === "completed") {
          ensureCurrency(sourceCurrency);
          runningBalances[sourceCurrency].available += sourceAmount;
          impacts.push({ currency: sourceCurrency, amount: sourceAmount, type: "credit" });
        } else if (state === "processing" || state === "initiated") {
          ensureCurrency(sourceCurrency);
          runningBalances[sourceCurrency].pending += sourceAmount;
          impacts.push({ currency: sourceCurrency, amount: sourceAmount, type: "credit" });
        }
        break;
      }

      case "receive": {
        if (state === "completed" && tx.destinationCurrency && tx.destinationAmount) {
          ensureCurrency(tx.destinationCurrency);
          runningBalances[tx.destinationCurrency].available += tx.destinationAmount;
          impacts.push({ currency: tx.destinationCurrency, amount: tx.destinationAmount, type: "credit" });
        } else if ((state === "processing" || state === "initiated") && tx.destinationCurrency && tx.destinationAmount) {
          ensureCurrency(tx.destinationCurrency);
          runningBalances[tx.destinationCurrency].pending += tx.destinationAmount;
          impacts.push({ currency: tx.destinationCurrency, amount: tx.destinationAmount, type: "credit" });
        }
        break;
      }

      case "refund": {
        if (state === "completed") {
          ensureCurrency(sourceCurrency);
          runningBalances[sourceCurrency].available += sourceAmount;
          impacts.push({ currency: sourceCurrency, amount: sourceAmount, type: "credit" });
        }
        break;
      }

      case "send": {
        if (state === "completed") {
          ensureCurrency(sourceCurrency);
          runningBalances[sourceCurrency].available -= sourceAmount;
          impacts.push({ currency: sourceCurrency, amount: sourceAmount, type: "debit" });
        } else if (state === "processing" || state === "initiated") {
          ensureCurrency(sourceCurrency);
          runningBalances[sourceCurrency].available -= sourceAmount;
          runningBalances[sourceCurrency].pending += sourceAmount;
          impacts.push({ currency: sourceCurrency, amount: sourceAmount, type: "debit" });
        } else if (state === "refunded") {
          ensureCurrency(sourceCurrency);
          runningBalances[sourceCurrency].available -= sourceAmount;
          impacts.push({ currency: sourceCurrency, amount: sourceAmount, type: "debit" });
        }
        break;
      }

      case "fee": {
        if (state === "completed") {
          ensureCurrency(sourceCurrency);
          runningBalances[sourceCurrency].available -= sourceAmount;
          impacts.push({ currency: sourceCurrency, amount: sourceAmount, type: "debit" });
        }
        break;
      }

      case "conversion": {
        if (state === "completed") {
          ensureCurrency(sourceCurrency);
          runningBalances[sourceCurrency].available -= sourceAmount;
          impacts.push({ currency: sourceCurrency, amount: sourceAmount, type: "debit" });
          if (tx.destinationCurrency && tx.destinationAmount) {
            ensureCurrency(tx.destinationCurrency);
            runningBalances[tx.destinationCurrency].available += tx.destinationAmount;
            impacts.push({ currency: tx.destinationCurrency, amount: tx.destinationAmount, type: "credit" });
          }
        }
        break;
      }
    }

    timeline.push({
      transaction: tx,
      balanceImpact: impacts,
      runningBalances: JSON.parse(JSON.stringify(runningBalances)),
    });
  }

  // Return in reverse chronological order (newest first)
  return timeline.reverse();
}
