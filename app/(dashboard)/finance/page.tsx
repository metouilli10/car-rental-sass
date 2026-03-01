import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  subDays,
} from "date-fns";
import { unstable_cache } from "next/cache";
import type { ExpenseCategory } from "@prisma/client";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { FinanceCenterView } from "@/components/finance/FinanceCenterView";

/* ── Period types ────────────────────────────────────────── */

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
        label: "Période personnalisée",
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

/* ── Previous period helper ──────────────────────────────── */

function computePreviousWindow(current: { from: Date; to: Date }) {
  const durationMs = current.to.getTime() - current.from.getTime();
  return {
    from: new Date(current.from.getTime() - durationMs - 1),
    to: new Date(current.from.getTime() - 1),
  };
}

function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/* ── Fixed vs variable categorization ────────────────────── */

const FIXED_CATEGORIES: ExpenseCategory[] = ["ASSURANCE", "TAXES", "SALAIRES", "LOYER"];
const FINANCE_QUERY_CACHE_SECONDS = 60;
const FINANCE_VEHICLES_CACHE_SECONDS = 300;

function isFixedCategory(cat: ExpenseCategory) {
  return FIXED_CATEGORIES.includes(cat);
}

const getFinanceSnapshotCached = unstable_cache(
  async (
    agencyId: string,
    windowFromIso: string,
    windowToIso: string,
    prevWindowFromIso: string,
    prevWindowToIso: string
  ) => {
    const window = {
      from: new Date(windowFromIso),
      to: new Date(windowToIso),
    };
    const prevWindow = {
      from: new Date(prevWindowFromIso),
      to: new Date(prevWindowToIso),
    };
    const expenseDelegate = (prisma as unknown as { expense?: any }).expense;

    const paymentDateFilter = (w: { from: Date; to: Date }) => ({
      OR: [
        { paidAt: { gte: w.from, lte: w.to } },
        { AND: [{ paidAt: null }, { createdAt: { gte: w.from, lte: w.to } }] },
      ],
    });

    const refundDateFilter = (w: { from: Date; to: Date }) => ({
      updatedAt: { gte: w.from, lte: w.to },
    });

    const rentalRevenueWhere = (w: { from: Date; to: Date }) => ({
      booking: { agencyId },
      status: "PAID" as const,
      category: "RENTAL" as const,
      ...paymentDateFilter(w),
    });

    const [
      revenueAgg,
      expensesAgg,
      cashIncomeAgg,
      refundAgg,
      cashRefundAgg,
      cashExpenseAgg,
      expenseCategoryAgg,
      prevRevenueAgg,
      prevExpensesAgg,
      prevCashIncomeAgg,
      prevRefundAgg,
      prevCashRefundAgg,
      prevCashExpenseAgg,
      vehicleRevenueByBooking,
      unpaidBookingsAgg,
      depositsHeldAgg,
      depositsHeldCount,
      refundedPaymentsAgg,
      activeVehicleCount,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: rentalRevenueWhere(window),
        _sum: { amount: true },
      }),
      expenseDelegate
        ? expenseDelegate.aggregate({
            where: { agencyId, date: { gte: window.from, lte: window.to } },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: 0 } }),
      prisma.payment.aggregate({
        where: { ...rentalRevenueWhere(window), type: "CASH" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { agencyId },
          status: "REFUNDED",
          ...refundDateFilter(window),
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { agencyId },
          status: "REFUNDED",
          type: "CASH",
          ...refundDateFilter(window),
        },
        _sum: { amount: true },
      }),
      expenseDelegate
        ? expenseDelegate.aggregate({
            where: { agencyId, method: "CASH", date: { gte: window.from, lte: window.to } },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: 0 } }),
      expenseDelegate
        ? expenseDelegate.groupBy({
            by: ["category"],
            where: { agencyId, date: { gte: window.from, lte: window.to } },
            _sum: { amount: true },
          })
        : Promise.resolve([]),
      prisma.payment.aggregate({
        where: rentalRevenueWhere(prevWindow),
        _sum: { amount: true },
      }),
      expenseDelegate
        ? expenseDelegate.aggregate({
            where: { agencyId, date: { gte: prevWindow.from, lte: prevWindow.to } },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: 0 } }),
      prisma.payment.aggregate({
        where: { ...rentalRevenueWhere(prevWindow), type: "CASH" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { agencyId },
          status: "REFUNDED",
          ...refundDateFilter(prevWindow),
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { agencyId },
          status: "REFUNDED",
          type: "CASH",
          ...refundDateFilter(prevWindow),
        },
        _sum: { amount: true },
      }),
      expenseDelegate
        ? expenseDelegate.aggregate({
            where: { agencyId, method: "CASH", date: { gte: prevWindow.from, lte: prevWindow.to } },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: 0 } }),
      prisma.payment.groupBy({
        by: ["bookingId"],
        where: rentalRevenueWhere(window),
        _sum: { amount: true },
      }),
      prisma.booking.aggregate({
        where: {
          agencyId,
          paymentStatus: { in: ["PENDING", "PARTIAL"] },
          status: { notIn: ["CANCELED", "DRAFT"] },
        },
        _sum: { remainingAmount: true },
        _count: true,
      }),
      prisma.deposit.aggregate({
        where: { booking: { agencyId }, status: "HELD" },
        _sum: { amount: true },
      }),
      prisma.deposit.count({
        where: { booking: { agencyId }, status: "HELD" },
      }),
      prisma.payment.aggregate({
        where: { booking: { agencyId }, status: "REFUNDED", ...paymentDateFilter(window) },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.vehicle.count({
        where: { agencyId, status: { not: "UNAVAILABLE" } },
      }),
    ]);

    const vehicleRevenueBookings =
      vehicleRevenueByBooking.length > 0
        ? await prisma.booking.findMany({
            where: {
              agencyId,
              id: { in: vehicleRevenueByBooking.map((entry) => entry.bookingId) },
            },
            select: {
              id: true,
              vehicle: {
                select: { make: true, model: true },
              },
            },
          })
        : [];

    return {
      revenueAgg,
      expensesAgg,
      cashIncomeAgg,
      refundAgg,
      cashRefundAgg,
      cashExpenseAgg,
      expenseCategoryAgg,
      prevRevenueAgg,
      prevExpensesAgg,
      prevCashIncomeAgg,
      prevRefundAgg,
      prevCashRefundAgg,
      prevCashExpenseAgg,
      vehicleRevenueByBooking,
      vehicleRevenueBookings,
      unpaidBookingsAgg,
      depositsHeldAgg,
      depositsHeldCount,
      refundedPaymentsAgg,
      activeVehicleCount,
    };
  },
  ["finance-snapshot"],
  { revalidate: FINANCE_QUERY_CACHE_SECONDS }
);

const getFinanceVehiclesCached = unstable_cache(
  async (agencyId: string) =>
    prisma.vehicle.findMany({
      where: { agencyId },
      select: { id: true, make: true, model: true, plate: true },
      orderBy: [{ make: "asc" }, { model: "asc" }],
    }),
  ["finance-vehicles"],
  { revalidate: FINANCE_VEHICLES_CACHE_SECONDS }
);

/* ── Page ─────────────────────────────────────────────────── */

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const agencyId = session.user.agencyId;
  if (!agencyId) return null;
  const window = resolveFinanceWindow(params);
  const prevWindow = computePreviousWindow(window);
  const [
    {
      revenueAgg,
      expensesAgg,
      cashIncomeAgg,
      refundAgg,
      cashRefundAgg,
      cashExpenseAgg,
      expenseCategoryAgg,
      prevRevenueAgg,
      prevExpensesAgg,
      prevCashIncomeAgg,
      prevRefundAgg,
      prevCashRefundAgg,
      prevCashExpenseAgg,
      vehicleRevenueByBooking,
      vehicleRevenueBookings,
      unpaidBookingsAgg,
      depositsHeldAgg,
      depositsHeldCount,
      refundedPaymentsAgg,
      activeVehicleCount,
    },
    vehicles,
  ] = await Promise.all([
    getFinanceSnapshotCached(
      agencyId,
      window.from.toISOString(),
      window.to.toISOString(),
      prevWindow.from.toISOString(),
      prevWindow.to.toISOString()
    ),
    getFinanceVehiclesCached(agencyId),
  ]);

  /* ── Compute derived values ── */

  const revenuePeriod = Number(revenueAgg._sum.amount ?? 0);
  const refundedPeriod = Number(refundAgg._sum.amount ?? 0);
  const expensesPeriod = Number(expensesAgg._sum.amount ?? 0);
  const netProfit = revenuePeriod - refundedPeriod - expensesPeriod;

  const cashIncome = Number(cashIncomeAgg._sum.amount ?? 0);
  const cashRefunds = Number(cashRefundAgg._sum.amount ?? 0);
  const cashExpense = Number(cashExpenseAgg._sum.amount ?? 0);
  const cashInHand = cashIncome - cashRefunds - cashExpense;

  // Previous period
  const prevRevenue = Number(prevRevenueAgg._sum.amount ?? 0);
  const prevRefunds = Number(prevRefundAgg._sum.amount ?? 0);
  const prevExpenses = Number(prevExpensesAgg._sum.amount ?? 0);
  const prevNet = prevRevenue - prevRefunds - prevExpenses;
  const prevCashIn = Number(prevCashIncomeAgg._sum.amount ?? 0);
  const prevCashRefunds = Number(prevCashRefundAgg._sum.amount ?? 0);
  const prevCashOut = Number(prevCashExpenseAgg._sum.amount ?? 0);
  const prevCash = prevCashIn - prevCashRefunds - prevCashOut;

  // Deltas
  const cashDelta = deltaPercent(cashInHand, prevCash);
  const netDelta = deltaPercent(netProfit, prevNet);

  // Revenue per vehicle (group in JS)
  const bookingVehicleMap = new Map(
    vehicleRevenueBookings.map((booking) => [
      booking.id,
      `${booking.vehicle.make} ${booking.vehicle.model}`,
    ])
  );
  const vehicleRevenueMap = new Map<string, number>();
  for (const bookingRevenue of vehicleRevenueByBooking) {
    const name = bookingVehicleMap.get(bookingRevenue.bookingId);
    if (!name) continue;
    vehicleRevenueMap.set(
      name,
      (vehicleRevenueMap.get(name) ?? 0) + Number(bookingRevenue._sum.amount ?? 0)
    );
  }
  const vehicleRevenueTotal = Array.from(vehicleRevenueMap.values()).reduce((a, b) => a + b, 0);
  const vehicleRevenue = Array.from(vehicleRevenueMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: vehicleRevenueTotal > 0 ? (amount / vehicleRevenueTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Unpaid bookings
  const unpaidAmount = Number(unpaidBookingsAgg._sum.remainingAmount ?? 0);
  const unpaidCount = unpaidBookingsAgg._count;

  // Deposits held
  const depositsHeld = Number(depositsHeldAgg._sum.amount ?? 0);

  // Refunds pending
  const refundsPending = Number(refundedPaymentsAgg._sum.amount ?? 0);
  const refundsPendingCount = refundedPaymentsAgg._count;

  // Fixed vs Variable expenses
  let fixedAmount = 0;
  let variableAmount = 0;
  for (const item of expenseCategoryAgg as Array<{
    category: ExpenseCategory;
    _sum: { amount: number | null };
  }>) {
    const amt = Number(item._sum.amount ?? 0);
    if (isFixedCategory(item.category)) {
      fixedAmount += amt;
    } else {
      variableAmount += amt;
    }
  }
  const fixedPercentOfRevenue = revenuePeriod > 0 ? (fixedAmount / revenuePeriod) * 100 : 0;

  // Key metrics
  const paidBookingsTotal = vehicleRevenueByBooking.length;
  const revenuePerVehicle = activeVehicleCount > 0 ? revenuePeriod / activeVehicleCount : 0;
  const panierMoyen = paidBookingsTotal > 0 ? revenuePeriod / paidBookingsTotal : 0;

  return (
    <div className="space-y-6">
      <FinanceCenterView
        period={{
          range: window.range,
          label: window.label,
          from: window.fromInput,
          to: window.toInput,
        }}
        kpis={{
          cashInHand,
          unpaidAmount,
          unpaidCount,
          depositsHeld,
          depositsHeldCount,
          netProfit,
          revenuePeriod,
          expensesPeriod,
        }}
        deltas={{
          cashDelta,
          netDelta,
        }}
        vehicleRevenue={vehicleRevenue}
        costStructure={{
          fixedAmount,
          variableAmount,
          fixedPercentOfRevenue,
        }}
        metrics={{
          revenuePerVehicle,
          panierMoyen,
          activeVehicleCount,
        }}
        alerts={{
          unpaidAmount,
          unpaidCount,
          depositsToReturn: depositsHeld,
          depositsToReturnCount: depositsHeldCount,
          refundsPending,
          refundsPendingCount,
        }}
        vehicles={vehicles}
      />
    </div>
  );
}
