export type Currency = "SGD" | "PHP" | "MYR" | "IDR" | "THB" | "VND" | "USD";

export type TransactionState =
  | "initiated"
  | "processing"
  | "completed"
  | "failed"
  | "refunded";

export type TransactionType =
  | "send"
  | "receive"
  | "conversion"
  | "fee"
  | "refund"
  | "deposit";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  state: TransactionState;
  sourceCurrency: Currency;
  sourceAmount: number;
  destinationCurrency?: Currency;
  destinationAmount?: number;
  exchangeRate?: number;
  fee?: number;
  feeCurrency?: Currency;
  description: string;
  createdAt: string;
  updatedAt: string;
  relatedTransactionId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  homeCurrency: Currency;
  country: string;
}

export interface CurrencyBalance {
  currency: Currency;
  available: number;
  pending: number;
  total: number;
}

export interface BalanceSummary {
  balances: CurrencyBalance[];
  totalInHomeCurrency: number;
  homeCurrency: Currency;
}

export interface TimelineEntry {
  transaction: Transaction;
  balanceImpact: {
    currency: Currency;
    amount: number;
    type: "credit" | "debit";
  }[];
  runningBalances: Record<string, { available: number; pending: number }>;
}
