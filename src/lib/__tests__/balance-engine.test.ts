import { calculateBalances, buildTimeline } from "../balance-engine";
import { Transaction, Currency } from "../types";

function makeTx(overrides: Partial<Transaction> & { id: string }): Transaction {
  return {
    userId: "user-test",
    type: "deposit",
    state: "completed",
    sourceCurrency: "SGD",
    sourceAmount: 100,
    description: "test",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("calculateBalances", () => {
  it("returns empty balances for no transactions", () => {
    const result = calculateBalances([], "USD");
    expect(result.balances).toEqual([]);
    expect(result.totalInHomeCurrency).toBe(0);
    expect(result.homeCurrency).toBe("USD");
  });

  it("adds completed deposits to available", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 1000 }),
    ];
    const result = calculateBalances(txs, "SGD");
    expect(result.balances).toHaveLength(1);
    expect(result.balances[0].currency).toBe("SGD");
    expect(result.balances[0].available).toBe(1000);
    expect(result.balances[0].pending).toBe(0);
    expect(result.balances[0].total).toBe(1000);
  });

  it("adds processing deposits to pending", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "processing", sourceCurrency: "SGD", sourceAmount: 500 }),
    ];
    const result = calculateBalances(txs, "SGD");
    expect(result.balances[0].available).toBe(0);
    expect(result.balances[0].pending).toBe(500);
    expect(result.balances[0].total).toBe(500);
  });

  it("subtracts completed sends from available", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 1000 }),
      makeTx({ id: "2", type: "send", state: "completed", sourceCurrency: "SGD", sourceAmount: 300 }),
    ];
    const result = calculateBalances(txs, "SGD");
    expect(result.balances[0].available).toBe(700);
  });

  it("holds processing sends from available and adds to pending", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 1000 }),
      makeTx({ id: "2", type: "send", state: "processing", sourceCurrency: "SGD", sourceAmount: 400 }),
    ];
    const result = calculateBalances(txs, "SGD");
    expect(result.balances[0].available).toBe(600);
    expect(result.balances[0].pending).toBe(400);
    expect(result.balances[0].total).toBe(1000);
  });

  it("holds initiated sends from available and adds to pending", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 1000 }),
      makeTx({ id: "2", type: "send", state: "initiated", sourceCurrency: "SGD", sourceAmount: 200 }),
    ];
    const result = calculateBalances(txs, "SGD");
    expect(result.balances[0].available).toBe(800);
    expect(result.balances[0].pending).toBe(200);
  });

  it("ignores failed transactions entirely", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 1000 }),
      makeTx({ id: "2", type: "send", state: "failed", sourceCurrency: "SGD", sourceAmount: 500 }),
    ];
    const result = calculateBalances(txs, "SGD");
    expect(result.balances[0].available).toBe(1000);
  });

  it("subtracts completed fees from available", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 1000 }),
      makeTx({ id: "2", type: "fee", state: "completed", sourceCurrency: "SGD", sourceAmount: 5 }),
    ];
    const result = calculateBalances(txs, "SGD");
    expect(result.balances[0].available).toBe(995);
  });

  it("adds completed refunds to available", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 1000 }),
      makeTx({ id: "2", type: "send", state: "completed", sourceCurrency: "SGD", sourceAmount: 300 }),
      makeTx({ id: "3", type: "refund", state: "completed", sourceCurrency: "SGD", sourceAmount: 300 }),
    ];
    const result = calculateBalances(txs, "SGD");
    expect(result.balances[0].available).toBe(1000);
  });

  it("handles receive transactions (credits destination currency)", () => {
    const txs: Transaction[] = [
      makeTx({
        id: "1",
        type: "receive",
        state: "completed",
        sourceCurrency: "PHP",
        sourceAmount: 10000,
        destinationCurrency: "SGD",
        destinationAmount: 260,
      }),
    ];
    const result = calculateBalances(txs, "SGD");
    const sgdBalance = result.balances.find((b) => b.currency === "SGD");
    expect(sgdBalance).toBeDefined();
    expect(sgdBalance!.available).toBe(260);
  });

  it("handles completed conversions (debit source, credit destination)", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 1000 }),
      makeTx({
        id: "2",
        type: "conversion",
        state: "completed",
        sourceCurrency: "SGD",
        sourceAmount: 100,
        destinationCurrency: "THB",
        destinationAmount: 2640,
      }),
    ];
    const result = calculateBalances(txs, "SGD");
    const sgdBalance = result.balances.find((b) => b.currency === "SGD");
    const thbBalance = result.balances.find((b) => b.currency === "THB");
    expect(sgdBalance!.available).toBe(900);
    expect(thbBalance!.available).toBe(2640);
  });

  it("handles multi-currency balances", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 5000 }),
      makeTx({ id: "2", type: "deposit", state: "completed", sourceCurrency: "MYR", sourceAmount: 2000 }),
      makeTx({ id: "3", type: "send", state: "completed", sourceCurrency: "SGD", sourceAmount: 500 }),
      makeTx({ id: "4", type: "send", state: "completed", sourceCurrency: "MYR", sourceAmount: 500 }),
    ];
    const result = calculateBalances(txs, "SGD");
    const sgd = result.balances.find((b) => b.currency === "SGD");
    const myr = result.balances.find((b) => b.currency === "MYR");
    expect(sgd!.available).toBe(4500);
    expect(myr!.available).toBe(1500);
    expect(result.totalInHomeCurrency).toBeGreaterThan(0);
  });

  it("handles refunded sends (deducted in send, added back in refund)", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "MYR", sourceAmount: 10000 }),
      makeTx({ id: "2", type: "send", state: "refunded", sourceCurrency: "MYR", sourceAmount: 500 }),
      makeTx({ id: "3", type: "refund", state: "completed", sourceCurrency: "MYR", sourceAmount: 500 }),
    ];
    const result = calculateBalances(txs, "MYR");
    expect(result.balances[0].available).toBe(10000);
  });

  it("rounds balances to 2 decimal places", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 100.555 }),
      makeTx({ id: "2", type: "fee", state: "completed", sourceCurrency: "SGD", sourceAmount: 0.111 }),
    ];
    const result = calculateBalances(txs, "SGD");
    // 100.555 - 0.111 = 100.444 -> rounded to 100.44
    expect(result.balances[0].available).toBe(100.44);
  });
});

describe("buildTimeline", () => {
  it("returns empty timeline for no transactions", () => {
    const result = buildTimeline([], "SGD");
    expect(result).toEqual([]);
  });

  it("returns timeline sorted newest first", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", createdAt: "2025-01-01T00:00:00Z", sourceAmount: 100 }),
      makeTx({ id: "2", createdAt: "2025-03-01T00:00:00Z", sourceAmount: 200 }),
      makeTx({ id: "3", createdAt: "2025-02-01T00:00:00Z", sourceAmount: 150 }),
    ];
    const result = buildTimeline(txs, "SGD");
    expect(result[0].transaction.id).toBe("2");
    expect(result[1].transaction.id).toBe("3");
    expect(result[2].transaction.id).toBe("1");
  });

  it("includes balance impact for completed deposits", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 1000 }),
    ];
    const result = buildTimeline(txs, "SGD");
    expect(result).toHaveLength(1);
    expect(result[0].balanceImpact).toHaveLength(1);
    expect(result[0].balanceImpact[0]).toEqual({
      currency: "SGD",
      amount: 1000,
      type: "credit",
    });
  });

  it("shows empty balance impact for failed transactions", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "send", state: "failed", sourceCurrency: "SGD", sourceAmount: 500 }),
    ];
    const result = buildTimeline(txs, "SGD");
    expect(result[0].balanceImpact).toEqual([]);
  });

  it("tracks running balances across multiple transactions", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 1000, createdAt: "2025-01-01T00:00:00Z" }),
      makeTx({ id: "2", type: "send", state: "completed", sourceCurrency: "SGD", sourceAmount: 300, createdAt: "2025-01-02T00:00:00Z" }),
    ];
    const result = buildTimeline(txs, "SGD");
    // Newest first: send is first in result
    const sendEntry = result[0]; // tx-2 (newest)
    const depositEntry = result[1]; // tx-1
    expect(depositEntry.runningBalances["SGD"].available).toBe(1000);
    expect(sendEntry.runningBalances["SGD"].available).toBe(700);
  });

  it("shows two impacts for conversions", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "deposit", state: "completed", sourceCurrency: "SGD", sourceAmount: 1000, createdAt: "2025-01-01T00:00:00Z" }),
      makeTx({
        id: "2",
        type: "conversion",
        state: "completed",
        sourceCurrency: "SGD",
        sourceAmount: 100,
        destinationCurrency: "THB",
        destinationAmount: 2640,
        createdAt: "2025-01-02T00:00:00Z",
      }),
    ];
    const result = buildTimeline(txs, "SGD");
    const conversionEntry = result[0]; // newest
    expect(conversionEntry.balanceImpact).toHaveLength(2);
    expect(conversionEntry.balanceImpact[0]).toEqual({
      currency: "SGD",
      amount: 100,
      type: "debit",
    });
    expect(conversionEntry.balanceImpact[1]).toEqual({
      currency: "THB",
      amount: 2640,
      type: "credit",
    });
  });
});
