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
import { redirect } from "next/navigation";
import type { ExpenseCategory } from "@prisma/client";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { getEffectivePermissions } from "@/lib/permissions";
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
      vehicleExpensesByVehicle,
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
      expenseDelegate
        ? expenseDelegate.groupBy({
            by: ["vehicleId"],
            where: {
              agencyId,
              vehicleId: { not: null },
              date: { gte: window.from, lte: window.to },
            },
            _sum: { amount: true },
          })
        : Promise.resolve([]),
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
              vehicleId: true,
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
      vehicleExpensesByVehicle,
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
  const currentUser = await getCurrentUserAccessForPage();

  const params = await searchParams;
  const agencyId = currentUser.agencyId;
  const permissions = getEffectivePermissions(
    currentUser.role,
    currentUser.permissions,
  );

  if (!permissions["finance.view"]) {
    redirect("/dashboard");
  }
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
      vehicleExpensesByVehicle,
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

  // Vehicle profitability: revenue and direct costs by vehicleId
  const bookingToVehicle = new Map(
    vehicleRevenueBookings.map((b) => [
      b.id,
      {
        vehicleId: b.vehicleId,
        label: `${b.vehicle.make} ${b.vehicle.model}`,
      },
    ])
  );
  const vehicleRevenueById = new Map<string, { revenue: number; label: string }>();
  for (const entry of vehicleRevenueByBooking) {
    const info = bookingToVehicle.get(entry.bookingId);
    if (!info) continue;
    const current = vehicleRevenueById.get(info.vehicleId);
    const amount = Number(entry._sum.amount ?? 0);
    if (current) {
      current.revenue += amount;
    } else {
      vehicleRevenueById.set(info.vehicleId, { revenue: amount, label: info.label });
    }
  }
  const vehicleExpensesById = new Map<string, number>();
  for (const row of vehicleExpensesByVehicle as Array<{
    vehicleId: string | null;
    _sum: { amount: number | null };
  }>) {
    if (row.vehicleId) {
      vehicleExpensesById.set(row.vehicleId, Number(row._sum.amount ?? 0));
    }
  }
  const allVehicleIds = new Set([
    ...vehicleRevenueById.keys(),
    ...vehicleExpensesById.keys(),
  ]);
  const vehicleLabelById = new Map(
    vehicles.map((v) => [v.id, `${v.make} ${v.model}`])
  );
  const vehicleProfitability = Array.from(allVehicleIds)
    .map((vehicleId) => {
      const { revenue, label } = vehicleRevenueById.get(vehicleId) ?? {
        revenue: 0,
        label: vehicleLabelById.get(vehicleId) ?? "Véhicule inconnu",
      };
      const costs = vehicleExpensesById.get(vehicleId) ?? 0;
      const profit = revenue - costs;
      const marginPercent =
        revenue > 0 ? (profit / revenue) * 100 : (costs > 0 ? -100 : 0);
      return { vehicleId, label, revenue, costs, profit, marginPercent };
    })
    .sort((a, b) => b.profit - a.profit);

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

  // Expense breakdown by category (for NetProfitBreakdown)
  const expenseBreakdown: Partial<Record<ExpenseCategory, number>> = {};
  for (const item of expenseCategoryAgg as Array<{
    category: ExpenseCategory;
    _sum: { amount: number | null };
  }>) {
    expenseBreakdown[item.category] = Number(item._sum.amount ?? 0);
  }

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
        vehicleProfitability={vehicleProfitability}
        expenseBreakdown={expenseBreakdown}
        revenuePeriod={revenuePeriod}
        refundedPeriod={refundedPeriod}
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
          hasDeficit: netProfit < 0,
          netMarginPercent:
            revenuePeriod > 0 ? (netProfit / revenuePeriod) * 100 : null,
          losingVehicles: vehicleProfitability
            .filter((v) => v.profit < 0)
            .map((v) => v.label),
        }}
        vehicles={vehicles}
      />
    </div>
  );
}
