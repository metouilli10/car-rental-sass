import type { DepositStatus } from "@prisma/client";

interface AmountRow {
  amount: number;
}

export interface DepositDamageReportLike {
  deductFromDeposit: boolean;
  deductedAmount: number;
}

export interface DepositReleaseLike {
  amount: number;
  status: DepositStatus;
  retainedAmount?: number | null;
}

export interface FinanceTotals {
  cashIn: number;
  cashOut: number;
  cashBalance: number;
  earnedIn: number;
  earnedOut: number;
  earnedNet: number;
}

export interface DepositReleaseBreakdown {
  cashOut: number;
  earnedIn: number;
  retainedAmount: number;
  refundedAmount: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampAmount(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function resolveRetainedDepositAmount(
  depositAmount: number,
  reports: DepositDamageReportLike[]
): number {
  const retained = reports.find(
    (report) => report.deductFromDeposit && report.deductedAmount > 0
  )?.deductedAmount;

  if (!retained) {
    return 0;
  }

  return clampAmount(retained, 0, depositAmount);
}

export function getDepositReleaseBreakdown(
  deposit: DepositReleaseLike
): DepositReleaseBreakdown {
  const retainedAmount = clampAmount(deposit.retainedAmount ?? 0, 0, deposit.amount);

  switch (deposit.status) {
    case "RETURNED":
      return {
        cashOut: deposit.amount,
        earnedIn: 0,
        retainedAmount: 0,
        refundedAmount: deposit.amount,
      };
    case "PARTIAL_RETURNED":
      return {
        cashOut: round(deposit.amount - retainedAmount),
        earnedIn: retainedAmount,
        retainedAmount,
        refundedAmount: round(deposit.amount - retainedAmount),
      };
    case "FORFEITED":
      return {
        cashOut: 0,
        earnedIn: retainedAmount,
        retainedAmount,
        refundedAmount: 0,
      };
    default:
      return {
        cashOut: 0,
        earnedIn: 0,
        retainedAmount: 0,
        refundedAmount: 0,
      };
  }
}

export function calculateFinanceTotals(input: {
  rentalPayments: AmountRow[];
  refunds: AmountRow[];
  cashExpenses: AmountRow[];
  heldDeposits: AmountRow[];
  releasedDeposits: DepositReleaseLike[];
}): FinanceTotals {
  const rentalPaymentsTotal = input.rentalPayments.reduce((sum, row) => sum + row.amount, 0);
  const refundsTotal = input.refunds.reduce((sum, row) => sum + row.amount, 0);
  const cashExpensesTotal = input.cashExpenses.reduce((sum, row) => sum + row.amount, 0);
  const heldDepositsTotal = input.heldDeposits.reduce((sum, row) => sum + row.amount, 0);
  const depositReleaseTotals = input.releasedDeposits.reduce(
    (sum, row) => {
      const breakdown = getDepositReleaseBreakdown(row);

      return {
        cashOut: sum.cashOut + breakdown.cashOut,
        earnedIn: sum.earnedIn + breakdown.earnedIn,
      };
    },
    { cashOut: 0, earnedIn: 0 }
  );

  const cashIn = rentalPaymentsTotal + heldDepositsTotal;
  const cashOut = refundsTotal + cashExpensesTotal + depositReleaseTotals.cashOut;
  const earnedIn = rentalPaymentsTotal + depositReleaseTotals.earnedIn;
  const earnedOut = refundsTotal + cashExpensesTotal;

  return {
    cashIn: round(cashIn),
    cashOut: round(cashOut),
    cashBalance: round(cashIn - cashOut),
    earnedIn: round(earnedIn),
    earnedOut: round(earnedOut),
    earnedNet: round(earnedIn - earnedOut),
  };
}
