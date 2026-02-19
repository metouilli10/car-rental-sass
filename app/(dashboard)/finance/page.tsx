import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  subDays,
} from "date-fns";
import type { ExpenseCategory, PaymentType } from "@prisma/client";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { expenseCategoryLabel } from "@/components/finance/constants";
import { FinanceView } from "@/components/finance/FinanceView";

type FinanceRange = "today" | "7d" | "month" | "quarter" | "custom";

type FinancePageProps = {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
  }>;
};

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function resolveRange(rawRange?: string): Exclude<FinanceRange, "custom"> {
  if (rawRange === "today" || rawRange === "7d" || rawRange === "quarter") return rawRange;
  return "month";
}

function resolveFinanceWindow(params: { range?: string; from?: string; to?: string }) {
  if (params.range === "custom") {
    const from = parseDate(params.from);
    const to = parseDate(params.to);

    if (from && to && from <= to) {
      return {
        range: "custom" as const,
        from: startOfDay(from),
        to: endOfDay(to),
        fromInput: params.from ?? "",
        toInput: params.to ?? "",
        label: "Periode personnalisee",
      };
    }
  }

  const now = new Date();
  const range = resolveRange(params.range);

  if (range === "today") {
    return {
      range,
      from: startOfDay(now),
      to: endOfDay(now),
      fromInput: "",
      toInput: "",
      label: "Aujourd'hui",
    };
  }

  if (range === "7d") {
    return {
      range,
      from: startOfDay(subDays(now, 6)),
      to: endOfDay(now),
      fromInput: "",
      toInput: "",
      label: "7 jours",
    };
  }

  if (range === "quarter") {
    return {
      range,
      from: startOfQuarter(now),
      to: endOfQuarter(now),
      fromInput: "",
      toInput: "",
      label: "Ce trimestre",
    };
  }

  return {
    range: "month" as const,
    from: startOfMonth(now),
    to: endOfMonth(now),
    fromInput: "",
    toInput: "",
    label: "Ce mois",
  };
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const params = await searchParams;
  const agencyId = session.user.agencyId;
  const window = resolveFinanceWindow(params);
  const expenseDelegate = (prisma as unknown as { expense?: any }).expense;

  const paymentDateInRangeFilter = {
    OR: [
      { paidAt: { gte: window.from, lte: window.to } },
      {
        AND: [
          { paidAt: null },
          { createdAt: { gte: window.from, lte: window.to } },
        ],
      },
    ],
  };

  const [
    incomes,
    deposits,
    expenses,
    vehicles,
    revenueAgg,
    expensesAgg,
    depositsHeldAgg,
    cashIncomeAgg,
    cashExpenseAgg,
    expenseCategoryAgg,
    paymentMethodAgg,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: {
        booking: { agencyId },
        ...paymentDateInRangeFilter,
      },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        paidAt: true,
        createdAt: true,
        booking: {
          select: {
            customer: { select: { name: true } },
            vehicle: { select: { make: true, model: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.deposit.findMany({
      where: {
        booking: { agencyId },
        heldAt: { gte: window.from, lte: window.to },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        heldAt: true,
        returnedAt: true,
        booking: {
          select: {
            customer: { select: { name: true } },
            vehicle: { select: { make: true, model: true } },
          },
        },
      },
      orderBy: { heldAt: "desc" },
      take: 300,
    }),
    expenseDelegate
      ? expenseDelegate.findMany({
          where: {
            agencyId,
            date: { gte: window.from, lte: window.to },
          },
          select: {
            id: true,
            date: true,
            category: true,
            amount: true,
            method: true,
            note: true,
            receiptUrl: true,
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                plate: true,
              },
            },
          },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: 300,
        })
      : Promise.resolve([]),
    prisma.vehicle.findMany({
      where: { agencyId },
      select: { id: true, make: true, model: true, plate: true },
      orderBy: [{ make: "asc" }, { model: "asc" }],
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "PAID",
        ...paymentDateInRangeFilter,
      },
      _sum: { amount: true },
    }),
    expenseDelegate
      ? expenseDelegate.aggregate({
          where: {
            agencyId,
            date: { gte: window.from, lte: window.to },
          },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),
    prisma.deposit.aggregate({
      where: {
        booking: { agencyId },
        status: "HELD",
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "PAID",
        type: "CASH",
        ...paymentDateInRangeFilter,
      },
      _sum: { amount: true },
    }),
    expenseDelegate
      ? expenseDelegate.aggregate({
          where: {
            agencyId,
            method: "CASH",
            date: { gte: window.from, lte: window.to },
          },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),
    expenseDelegate
      ? expenseDelegate.groupBy({
          by: ["category"],
          where: {
            agencyId,
            date: { gte: window.from, lte: window.to },
          },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
    Promise.all([
      prisma.payment.aggregate({
        where: {
          booking: { agencyId },
          status: "PAID",
          type: "CASH",
          ...paymentDateInRangeFilter,
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { agencyId },
          status: "PAID",
          type: "CARD",
          ...paymentDateInRangeFilter,
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { agencyId },
          status: "PAID",
          type: "TRANSFER",
          ...paymentDateInRangeFilter,
        },
        _sum: { amount: true },
      }),
    ]),
  ]);

  const revenuePeriod = Number(revenueAgg._sum.amount ?? 0);
  const expensesPeriod = Number(expensesAgg._sum.amount ?? 0);
  const netProfit = revenuePeriod - expensesPeriod;
  const depositsHeld = Number(depositsHeldAgg._sum.amount ?? 0);
  const cashIncome = Number(cashIncomeAgg._sum.amount ?? 0);
  const cashExpense = Number(cashExpenseAgg._sum.amount ?? 0);
  const cashInHand = cashIncome - cashExpense;

  const expenseByCategory = expenseCategoryAgg
    .map((item: { category: ExpenseCategory; _sum: { amount: number | null } }) => ({
      key: item.category,
      label: expenseCategoryLabel[item.category],
      amount: Number(item._sum.amount ?? 0),
    }))
    .filter((item: { amount: number }) => item.amount > 0)
    .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount);

  const expenseBreakdownTotal = expenseByCategory.reduce(
    (acc: number, item: { amount: number }) => acc + item.amount,
    0
  );
  const expenseBreakdown = expenseByCategory.map((item: { key: string; label: string; amount: number }) => ({
    ...item,
    percentage: expenseBreakdownTotal > 0 ? (item.amount / expenseBreakdownTotal) * 100 : 0,
  }));

  const paymentMethodRows: Array<{
    key: Extract<PaymentType, "CASH" | "CARD" | "TRANSFER">;
    label: string;
    amount: number;
  }> = [
    { key: "CASH", label: "Cash", amount: Number(paymentMethodAgg[0]._sum.amount ?? 0) },
    { key: "CARD", label: "Carte", amount: Number(paymentMethodAgg[1]._sum.amount ?? 0) },
    { key: "TRANSFER", label: "Virement", amount: Number(paymentMethodAgg[2]._sum.amount ?? 0) },
  ];

  const paymentBreakdownTotal = paymentMethodRows.reduce((acc, item) => acc + item.amount, 0);
  const paymentBreakdown = paymentMethodRows.map((item) => ({
    ...item,
    percentage: paymentBreakdownTotal > 0 ? (item.amount / paymentBreakdownTotal) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      <FinanceView
        period={{
          range: window.range,
          label: window.label,
          from: window.fromInput,
          to: window.toInput,
        }}
        kpis={{
          revenuePeriod,
          expensesPeriod,
          netProfit,
          cashInHand,
          depositsHeld,
        }}
        incomes={incomes.map((payment) => ({
          id: payment.id,
          amount: Number(payment.amount),
          type: payment.type,
          status: payment.status,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
          customerName: payment.booking.customer.name,
          vehicleName: `${payment.booking.vehicle.make} ${payment.booking.vehicle.model}`,
        }))}
        expenses={expenses.map((expense: any) => ({
          ...expense,
          amount: Number(expense.amount),
        }))}
        deposits={deposits.map((deposit) => ({
          id: deposit.id,
          amount: Number(deposit.amount),
          status: deposit.status,
          heldAt: deposit.heldAt,
          returnedAt: deposit.returnedAt,
          customerName: deposit.booking.customer.name,
          vehicleName: `${deposit.booking.vehicle.make} ${deposit.booking.vehicle.model}`,
        }))}
        expenseBreakdown={expenseBreakdown}
        paymentBreakdown={paymentBreakdown}
        vehicles={vehicles}
      />
    </div>
  );
}
