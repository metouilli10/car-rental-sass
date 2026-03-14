/**
 * Caisse (cash register) – single source of truth for daily money movements.
 * All queries are scoped by agencyId and run in a transaction for a consistent snapshot.
 */

import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  computeBookingDue,
  computeOutstanding,
  IMPAYES_SCOPE_STATUSES,
  isUrgentForPeriod,
} from "./rules";
import type { DateRange } from "./ranges";
import { expenseCategoryLabel, paymentMethodLabel } from "@/components/finance/constants";
import type { PaymentType } from "@prisma/client";
import type { ExpenseCategory } from "@prisma/client";
import {
  calculateFinanceTotals,
  getDepositReleaseBreakdown,
  resolveRetainedDepositAmount,
} from "./finance";

// ─── happenedAt rules (single source of truth) ─────────────────────────────
// Primary date field per source; fallback to createdAt for legacy rows with null.

export type CaisseMovementType =
  | "payment"
  | "deposit_received"
  | "deposit_returned"
  | "refund"
  | "expense";

export interface CaisseMovement {
  id: string;
  type: CaisseMovementType;
  direction: "in" | "out";
  amount: number;
  customerName: string;
  label: string;
  happenedAt: Date;
  sourceId: string;
  sourceType: "Payment" | "Deposit" | "Expense";
  reference: string;
  bookingId: string | null;
}

/** Get the single date used for this movement (UI and totals must use this only). Exported for tests. */
export function getMovementHappenedAt(
  row: {
    paidAt?: Date | null;
    heldAt?: Date;
    returnedAt?: Date | null;
    updatedAt: Date;
    createdAt: Date;
  },
  type: CaisseMovementType
): Date {
  switch (type) {
    case "payment":
      return row.paidAt ? new Date(row.paidAt) : new Date(row.createdAt);
    case "deposit_received":
      return row.heldAt ? new Date(row.heldAt) : new Date(row.createdAt);
    case "deposit_returned":
      return row.returnedAt ? new Date(row.returnedAt) : new Date(row.createdAt);
    case "refund":
      // REFUNDED: using updatedAt until refundedAt exists; may misattribute if payment row is updated later.
      return new Date(row.updatedAt);
    default:
      return new Date(row.createdAt);
  }
}

const MOVEMENT_LABELS: Record<CaisseMovementType, string> = {
  payment: "Paiement location",
  deposit_received: "Caution reçue",
  deposit_returned: "Caution remboursée",
  refund: "Remboursement",
  expense: "Charge (sortie caisse)",
};

export interface CaisseByDateResult {
  cashEntrees: number;
  cashSorties: number;
  cashSolde: number;
  earnedEntrees: number;
  earnedSorties: number;
  resultatNet: number;
  movements: CaisseMovement[];
  toCollectToday?: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Returns caisse data for the given calendar day. All four movement queries run
 * in a single transaction for consistency. When `date` is today, also computes
 * toCollectToday (à encaisser).
 */
export async function getCaisseByDate(
  agencyId: string,
  date: Date
): Promise<CaisseByDateResult> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const todayRange: DateRange = {
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  };
  const isToday =
    date.getTime() >= todayRange.start.getTime() &&
    date.getTime() <= todayRange.end.getTime();

  const [
    paymentsPaid,
    depositsHeld,
    depositsReturned,
    refunds,
    cashExpensesToday,
    ...toCollectData
  ] = await prisma.$transaction([
    // 1. Entrées: payments PAID with paidAt in day (fallback: createdAt in day handled when building happenedAt)
    prisma.payment.findMany({
      where: {
        booking: { agencyId },
        status: "PAID",
        category: "RENTAL",
        OR: [
          { paidAt: { gte: dayStart, lte: dayEnd } },
          {
            paidAt: null,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        ],
      },
      select: {
        id: true,
        amount: true,
        category: true,
        type: true,
        paidAt: true,
        createdAt: true,
        bookingId: true,
        booking: {
          select: {
            id: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    }),
    // 2. Entrées: deposits HELD with heldAt in day (heldAt is required in schema)
    prisma.deposit.findMany({
      where: {
        booking: { agencyId },
        status: "HELD",
        heldAt: { gte: dayStart, lte: dayEnd },
      },
      select: {
        id: true,
        amount: true,
        heldAt: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { heldAt: "desc" },
    }),
    // 3. Deposit releases/retentions recognized in day
    prisma.deposit.findMany({
      where: {
        booking: { agencyId },
        status: { in: ["RETURNED", "PARTIAL_RETURNED", "FORFEITED"] },
        OR: [
          { returnedAt: { gte: dayStart, lte: dayEnd } },
          {
            returnedAt: null,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        ],
      },
      select: {
        id: true,
        amount: true,
        status: true,
        returnedAt: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            customer: { select: { name: true } },
            damageReports: {
              where: {
                deductFromDeposit: true,
                deductedAmount: { gt: 0 },
              },
              orderBy: { reportedAt: "desc" },
              take: 1,
              select: {
                deductFromDeposit: true,
                deductedAmount: true,
              },
            },
          },
        },
      },
      orderBy: { returnedAt: "desc" },
    }),
    // 4. Sorties: REFUNDED payments (using updatedAt until refundedAt exists)
    prisma.payment.findMany({
      where: {
        booking: { agencyId },
        status: "REFUNDED",
        category: "REFUND",
        updatedAt: { gte: dayStart, lte: dayEnd },
      },
      select: {
        id: true,
        amount: true,
        updatedAt: true,
        createdAt: true,
        bookingId: true,
        booking: {
          select: {
            id: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    // 5. Sorties: cash expenses (charges) for the day
    prisma.expense.findMany({
      where: {
        agencyId,
        date: { gte: dayStart, lte: dayEnd },
        method: "CASH",
      },
      select: {
        id: true,
        amount: true,
        date: true,
        category: true,
        createdAt: true,
      },
      orderBy: { date: "desc" },
    }),
    // 6–7. Optional: toCollectToday when date is today
    ...(isToday
      ? [
          prisma.booking.findMany({
            where: {
              agencyId,
              status: { in: IMPAYES_SCOPE_STATUSES },
            },
            select: {
              id: true,
              startDate: true,
              status: true,
              totalPrice: true,
              totalTtc: true,
              taxEnabled: true,
              discountAmount: true,
              addonsTotal: true,
            },
          }),
          prisma.payment.groupBy({
            by: ["bookingId"],
            where: {
              booking: { agencyId },
              status: "PAID",
              category: "RENTAL",
            },
            _sum: { amount: true },
          }),
        ]
      : []),
  ]);

  const movements: CaisseMovement[] = [
    ...paymentsPaid.map((p) => {
      const happenedAt = getMovementHappenedAt(
        { paidAt: p.paidAt, createdAt: p.createdAt, updatedAt: p.createdAt },
        "payment"
      );
      return {
        id: `payment-${p.id}`,
        type: "payment" as const,
        direction: "in" as const,
        amount: p.amount,
        customerName: p.booking.customer.name,
        label: MOVEMENT_LABELS.payment,
        happenedAt,
        sourceId: p.id,
        sourceType: "Payment" as const,
        reference: paymentMethodLabel[p.type as PaymentType],
        bookingId: p.bookingId,
      };
    }),
    ...depositsHeld.map((d) => {
      const happenedAt = getMovementHappenedAt(
        {
          heldAt: d.heldAt,
          createdAt: d.createdAt,
          updatedAt: d.createdAt,
        },
        "deposit_received"
      );
      return {
        id: `deposit-held-${d.id}`,
        type: "deposit_received" as const,
        direction: "in" as const,
        amount: d.amount,
        customerName: d.booking.customer.name,
        label: MOVEMENT_LABELS.deposit_received,
        happenedAt,
        sourceId: d.id,
        sourceType: "Deposit" as const,
        reference: "Caution",
        bookingId: d.booking.id,
      };
    }),
    ...depositsReturned.flatMap((d) => {
      const retainedAmount = resolveRetainedDepositAmount(d.amount, d.booking.damageReports);
      const breakdown = getDepositReleaseBreakdown({
        amount: d.amount,
        status: d.status,
        retainedAmount,
      });
      if (breakdown.cashOut <= 0) {
        return [];
      }
      const happenedAt = getMovementHappenedAt(
        {
          returnedAt: d.returnedAt,
          createdAt: d.createdAt,
          updatedAt: d.createdAt,
        },
        "deposit_returned"
      );
      return [
        {
          id: `deposit-release-${d.id}`,
          type: "deposit_returned" as const,
          direction: "out" as const,
          amount: breakdown.cashOut,
          customerName: d.booking.customer.name,
          label: MOVEMENT_LABELS.deposit_returned,
          happenedAt,
          sourceId: d.id,
          sourceType: "Deposit" as const,
          reference: "Caution",
          bookingId: d.booking.id,
        },
      ];
    }),
    ...refunds.map((p) => {
      const happenedAt = getMovementHappenedAt(
        {
          updatedAt: p.updatedAt,
          createdAt: p.createdAt,
        },
        "refund"
      );
      return {
        id: `refund-${p.id}`,
        type: "refund" as const,
        direction: "out" as const,
        amount: p.amount,
        customerName: p.booking.customer.name,
        label: MOVEMENT_LABELS.refund,
        happenedAt,
        sourceId: p.id,
        sourceType: "Payment" as const,
        reference: "Remboursement",
        bookingId: p.bookingId,
      };
    }),
    ...cashExpensesToday.map((e) => ({
      id: `expense-${e.id}`,
      type: "expense" as const,
      direction: "out" as const,
      amount: Number(e.amount),
      customerName: "Charge",
      label: MOVEMENT_LABELS.expense,
      happenedAt: new Date(e.date),
      sourceId: e.id,
      sourceType: "Expense" as const,
      reference: expenseCategoryLabel[e.category],
      bookingId: null as string | null,
    })),
  ].sort((a, b) => b.happenedAt.getTime() - a.happenedAt.getTime());

  const totals = calculateFinanceTotals({
    rentalPayments: paymentsPaid,
    refunds,
    cashExpenses: cashExpensesToday.map((expense) => ({
      amount: Number(expense.amount),
    })),
    heldDeposits: depositsHeld,
    releasedDeposits: depositsReturned.map((deposit) => ({
      amount: deposit.amount,
      status: deposit.status,
      retainedAmount: resolveRetainedDepositAmount(
        deposit.amount,
        deposit.booking.damageReports
      ),
    })),
  });

  let toCollectToday: number | undefined;
  if (isToday && toCollectData.length >= 2) {
    const impayesBookings = toCollectData[0] as Array<{
      id: string;
      startDate: Date;
      status: string;
      totalPrice: number;
      totalTtc: number;
      taxEnabled: boolean;
      discountAmount: number;
      addonsTotal: number;
    }>;
    const rentalPaidByBooking = toCollectData[1] as Array<{
      bookingId: string;
      _sum: { amount: number | null };
    }>;
    const rentalPaidMap = new Map<string, number>();
    for (const row of rentalPaidByBooking) {
      rentalPaidMap.set(row.bookingId, row._sum.amount ?? 0);
    }
    toCollectToday = round(
      impayesBookings.reduce((sum, b) => {
        const due = computeBookingDue({
          totalPrice: b.totalPrice,
          totalTtc: b.totalTtc,
          taxEnabled: b.taxEnabled,
          discountAmount: b.discountAmount,
          addonsTotal: b.addonsTotal,
        });
        const paid = rentalPaidMap.get(b.id) ?? 0;
        const outstanding = computeOutstanding(due, paid);
        const urgent = isUrgentForPeriod(
          outstanding,
          b.startDate,
          b.status as "CONFIRMED" | "ACTIVE" | "COMPLETED",
          todayRange
        );
        return urgent ? sum + outstanding : sum;
      }, 0)
    );
  }

  return {
    cashEntrees: totals.cashIn,
    cashSorties: totals.cashOut,
    cashSolde: totals.cashBalance,
    earnedEntrees: totals.earnedIn,
    earnedSorties: totals.earnedOut,
    resultatNet: totals.earnedNet,
    movements,
    ...(toCollectToday !== undefined && { toCollectToday }),
  };
}

/**
 * Returns caisse data for a date range (e.g. a full month). Same movement types and
 * totals as getCaisseByDate, but for all movements between rangeStart and rangeEnd (inclusive).
 * Does not compute toCollectToday.
 */
export async function getCaisseByDateRange(
  agencyId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<Omit<CaisseByDateResult, "toCollectToday">> {
  const [
    paymentsPaid,
    depositsHeld,
    depositsReturned,
    refunds,
    cashExpenses,
  ] = await prisma.$transaction([
    prisma.payment.findMany({
      where: {
        booking: { agencyId },
        status: "PAID",
        category: "RENTAL",
        OR: [
          { paidAt: { gte: rangeStart, lte: rangeEnd } },
          {
            paidAt: null,
            createdAt: { gte: rangeStart, lte: rangeEnd },
          },
        ],
      },
      select: {
        id: true,
        amount: true,
        category: true,
        type: true,
        paidAt: true,
        createdAt: true,
        bookingId: true,
        booking: {
          select: {
            id: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    }),
    prisma.deposit.findMany({
      where: {
        booking: { agencyId },
        status: "HELD",
        heldAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        id: true,
        amount: true,
        heldAt: true,
        createdAt: true,
        booking: {
          select: { id: true, customer: { select: { name: true } } },
        },
      },
      orderBy: { heldAt: "desc" },
    }),
    prisma.deposit.findMany({
      where: {
        booking: { agencyId },
        status: { in: ["RETURNED", "PARTIAL_RETURNED", "FORFEITED"] },
        OR: [
          { returnedAt: { gte: rangeStart, lte: rangeEnd } },
          {
            returnedAt: null,
            createdAt: { gte: rangeStart, lte: rangeEnd },
          },
        ],
      },
      select: {
        id: true,
        amount: true,
        status: true,
        returnedAt: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            customer: { select: { name: true } },
            damageReports: {
              where: {
                deductFromDeposit: true,
                deductedAmount: { gt: 0 },
              },
              orderBy: { reportedAt: "desc" },
              take: 1,
              select: {
                deductFromDeposit: true,
                deductedAmount: true,
              },
            },
          },
        },
      },
      orderBy: { returnedAt: "desc" },
    }),
    prisma.payment.findMany({
      where: {
        booking: { agencyId },
        status: "REFUNDED",
        category: "REFUND",
        updatedAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        id: true,
        amount: true,
        updatedAt: true,
        createdAt: true,
        bookingId: true,
        booking: {
          select: { id: true, customer: { select: { name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.expense.findMany({
      where: {
        agencyId,
        date: { gte: rangeStart, lte: rangeEnd },
        method: "CASH",
      },
      select: {
        id: true,
        amount: true,
        date: true,
        category: true,
        createdAt: true,
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const movements: CaisseMovement[] = [
    ...paymentsPaid.map((p) => {
      const happenedAt = getMovementHappenedAt(
        { paidAt: p.paidAt, createdAt: p.createdAt, updatedAt: p.createdAt },
        "payment"
      );
      return {
        id: `payment-${p.id}`,
        type: "payment" as const,
        direction: "in" as const,
        amount: p.amount,
        customerName: p.booking.customer.name,
        label: MOVEMENT_LABELS.payment,
        happenedAt,
        sourceId: p.id,
        sourceType: "Payment" as const,
        reference: paymentMethodLabel[p.type as PaymentType],
        bookingId: p.bookingId,
      };
    }),
    ...depositsHeld.map((d) => {
      const happenedAt = getMovementHappenedAt(
        {
          heldAt: d.heldAt,
          createdAt: d.createdAt,
          updatedAt: d.createdAt,
        },
        "deposit_received"
      );
      return {
        id: `deposit-held-${d.id}`,
        type: "deposit_received" as const,
        direction: "in" as const,
        amount: d.amount,
        customerName: d.booking.customer.name,
        label: MOVEMENT_LABELS.deposit_received,
        happenedAt,
        sourceId: d.id,
        sourceType: "Deposit" as const,
        reference: "Caution",
        bookingId: d.booking.id,
      };
    }),
    ...depositsReturned.flatMap((d) => {
      const retainedAmount = resolveRetainedDepositAmount(d.amount, d.booking.damageReports);
      const breakdown = getDepositReleaseBreakdown({
        amount: d.amount,
        status: d.status,
        retainedAmount,
      });
      if (breakdown.cashOut <= 0) {
        return [];
      }
      const happenedAt = getMovementHappenedAt(
        {
          returnedAt: d.returnedAt,
          createdAt: d.createdAt,
          updatedAt: d.createdAt,
        },
        "deposit_returned"
      );
      return [
        {
          id: `deposit-release-${d.id}`,
          type: "deposit_returned" as const,
          direction: "out" as const,
          amount: breakdown.cashOut,
          customerName: d.booking.customer.name,
          label: MOVEMENT_LABELS.deposit_returned,
          happenedAt,
          sourceId: d.id,
          sourceType: "Deposit" as const,
          reference: "Caution",
          bookingId: d.booking.id,
        },
      ];
    }),
    ...refunds.map((p) => {
      const happenedAt = getMovementHappenedAt(
        { updatedAt: p.updatedAt, createdAt: p.createdAt },
        "refund"
      );
      return {
        id: `refund-${p.id}`,
        type: "refund" as const,
        direction: "out" as const,
        amount: p.amount,
        customerName: p.booking.customer.name,
        label: MOVEMENT_LABELS.refund,
        happenedAt,
        sourceId: p.id,
        sourceType: "Payment" as const,
        reference: "Remboursement",
        bookingId: p.bookingId,
      };
    }),
    ...cashExpenses.map((e) => ({
      id: `expense-${e.id}`,
      type: "expense" as const,
      direction: "out" as const,
      amount: Number(e.amount),
      customerName: "Charge",
      label: MOVEMENT_LABELS.expense,
      happenedAt: new Date(e.date),
      sourceId: e.id,
      sourceType: "Expense" as const,
      reference: expenseCategoryLabel[e.category],
      bookingId: null as string | null,
    })),
  ].sort((a, b) => b.happenedAt.getTime() - a.happenedAt.getTime());

  const totals = calculateFinanceTotals({
    rentalPayments: paymentsPaid,
    refunds,
    cashExpenses: cashExpenses.map((expense) => ({
      amount: Number(expense.amount),
    })),
    heldDeposits: depositsHeld,
    releasedDeposits: depositsReturned.map((deposit) => ({
      amount: deposit.amount,
      status: deposit.status,
      retainedAmount: resolveRetainedDepositAmount(
        deposit.amount,
        deposit.booking.damageReports
      ),
    })),
  });

  return {
    cashEntrees: totals.cashIn,
    cashSorties: totals.cashOut,
    cashSolde: totals.cashBalance,
    earnedEntrees: totals.earnedIn,
    earnedSorties: totals.earnedOut,
    resultatNet: totals.earnedNet,
    movements,
  };
}
