# TejaCo Ledger - Multi-Currency Balance Engine

A full-stack application that provides real-time, transparent multi-currency balance tracking for TejaCo's cross-border remittance platform.

## Live Demo

**[https://tejaco-ledger.vercel.app](https://tejaco-ledger.vercel.app)**

### Demo Instructions

1. Open the app URL above
2. Select a user from the dropdown (3 demo users with different patterns):
   - **Maria Santos** (SGD) - Heavy PHP remitter, holds SGD + MYR, has pending transactions
   - **Ahmad bin Hassan** (MYR) - Sends to IDR/PHP/VND, holds MYR + THB, has refunded transactions
   - **Somchai Thongdee** (THB) - Mostly pending funds, holds THB + SGD, has currency conversions
3. View their **balance breakdown** (available, pending, total per currency)
4. Toggle **"Show in home currency"** to see all balances converted
5. Change the **Home Currency** dropdown to view totals in different currencies
6. Scroll down to the **Transaction Timeline** - filter by currency, state, type, or date range
7. Each transaction shows its balance impact (green = credit, red = debit)

## Architecture

```
Next.js 16 (App Router)
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main interactive Balance Explorer (client)
│   │   ├── layout.tsx            # Root layout with metadata
│   │   ├── globals.css           # Tailwind CSS v4
│   │   └── api/
│   │       └── users/
│   │           ├── route.ts                    # GET /api/users
│   │           └── [userId]/
│   │               ├── balance/route.ts        # GET /api/users/:id/balance
│   │               └── transactions/route.ts   # GET /api/users/:id/transactions
│   ├── components/
│   │   ├── BalanceCards.tsx       # Currency balance cards with totals
│   │   └── TransactionTimeline.tsx # Filterable transaction timeline
│   └── lib/
│       ├── types.ts              # TypeScript types (Transaction, User, Balance, etc.)
│       ├── seed-data.ts          # 53 transactions across 3 users, 5 currency pairs
│       ├── balance-engine.ts     # Core balance calculation + timeline builder
│       └── exchange-rates.ts     # Exchange rate conversion with historical variation
```

### Design Decisions

- **Single Next.js app** - API routes + frontend in one deploy. Simplest architecture for the scope.
- **In-memory data** - JSON seed data loaded at import time. No database needed for demo.
- **Balance engine as pure functions** - `calculateBalances()` and `buildTimeline()` are stateless, testable functions that take transactions and return computed results.
- **Separate balance types** - Available (spendable now), Pending (in-flight), Total. Processing/Initiated transactions move funds from available to pending.
- **Failed transactions excluded** - Failed sends have zero balance impact. Refunded sends are debited, with a separate refund credit transaction restoring funds.

### Tech Stack

- **Next.js 16** with App Router and TypeScript
- **Tailwind CSS v4** for styling
- **React 19** with hooks for state management
- **No external dependencies** beyond Next.js core

## API Endpoints

### `GET /api/users`
Returns all demo users.

### `GET /api/users/:userId/balance?homeCurrency=SGD`
Returns computed balances (available, pending, total) per currency, plus total in home currency.

### `GET /api/users/:userId/transactions?currency=SGD&state=completed&type=send&dateFrom=2025-01-01&dateTo=2025-06-01`
Returns transaction timeline with balance impact per entry. All query params are optional filters.

## Test Data

**53 transactions** across 3 users covering:

| Requirement | Coverage |
|-------------|----------|
| 3+ users | Maria Santos, Ahmad bin Hassan, Somchai Thongdee |
| 50+ transactions | 53 total |
| 4+ currency pairs | SGD→PHP, SGD→VND, MYR→IDR, MYR→PHP, MYR→VND, THB→VND, THB→IDR, THB→MYR, THB→PHP, SGD→THB |
| All states | Completed, Processing, Initiated, Failed, Refunded |
| All types | Send, Receive, Deposit, Fee, Refund, Conversion |
| Varying rates | SGD→PHP at 38.4 and 38.6; rates vary by month |
| Edge cases | User with mostly pending funds (Somchai), 3+ currencies (all users), failed tx excluded, refund restoring funds, currency conversion within wallet |

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Build

```bash
npm run build
npm start
```
