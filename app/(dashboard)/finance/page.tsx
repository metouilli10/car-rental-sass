import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  subDays,
} from "date-fns";
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

function isFixedCategory(cat: ExpenseCategory) {
  return FIXED_CATEGORIES.includes(cat);
}

/* ── Page ─────────────────────────────────────────────────── */

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const agencyId = session.user.agencyId;
  const window = resolveFinanceWindow(params);
  const prevWindow = computePreviousWindow(window);

  const expenseDelegate = (prisma as unknown as { expense?: any }).expense;

  // Date filter for payments (uses paidAt or createdAt fallback)
  const paymentDateFilter = (w: { from: Date; to: Date }) => ({
    OR: [
      { paidAt: { gte: w.from, lte: w.to } },
      { AND: [{ paidAt: null }, { createdAt: { gte: w.from, lte: w.to } }] },
    ],
  });

  const [
    // Current period
    revenueAgg,
    expensesAgg,
    cashIncomeAgg,
    cashExpenseAgg,
    expenseCategoryAgg,
    // Previous period (for deltas)
    prevRevenueAgg,
    prevExpensesAgg,
    prevCashIncomeAgg,
    prevCashExpenseAgg,
    // Revenue per vehicle
    vehiclePayments,
    // Alerts data
    unpaidBookings,
    depositsHeldAgg,
    depositsHeldCount,
    refundedPayments,
    // Metrics
    paidBookingsCount,
    activeVehicleCount,
    // Vehicles for AddExpenseDialog
    vehicles,
  ] = await Promise.all([
    /* ── Current period aggregates ── */
    prisma.payment.aggregate({
      where: { booking: { agencyId }, status: "PAID", ...paymentDateFilter(window) },
      _sum: { amount: true },
    }),
    expenseDelegate
      ? expenseDelegate.aggregate({
          where: { agencyId, date: { gte: window.from, lte: window.to } },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),
    prisma.payment.aggregate({
      where: { booking: { agencyId }, status: "PAID", type: "CASH", ...paymentDateFilter(window) },
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

    /* ── Previous period aggregates (for deltas) ── */
    prisma.payment.aggregate({
      where: { booking: { agencyId }, status: "PAID", ...paymentDateFilter(prevWindow) },
      _sum: { amount: true },
    }),
    expenseDelegate
      ? expenseDelegate.aggregate({
          where: { agencyId, date: { gte: prevWindow.from, lte: prevWindow.to } },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),
    prisma.payment.aggregate({
      where: { booking: { agencyId }, status: "PAID", type: "CASH", ...paymentDateFilter(prevWindow) },
      _sum: { amount: true },
    }),
    expenseDelegate
      ? expenseDelegate.aggregate({
          where: { agencyId, method: "CASH", date: { gte: prevWindow.from, lte: prevWindow.to } },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),

    /* ── Revenue per vehicle ── */
    prisma.payment.findMany({
      where: { booking: { agencyId }, status: "PAID", ...paymentDateFilter(window) },
      select: {
        amount: true,
        booking: {
          select: { vehicle: { select: { make: true, model: true } } },
        },
      },
    }),

    /* ── Alerts: unpaid bookings ── */
    prisma.booking.findMany({
      where: {
        agencyId,
        paymentStatus: { in: ["PENDING", "PARTIAL"] },
        status: { notIn: ["CANCELED", "DRAFT"] },
      },
      select: { remainingAmount: true },
    }),

    /* ── Alerts: deposits held ── */
    prisma.deposit.aggregate({
      where: { booking: { agencyId }, status: "HELD" },
      _sum: { amount: true },
    }),
    prisma.deposit.count({
      where: { booking: { agencyId }, status: "HELD" },
    }),

    /* ── Alerts: refunded payments ── */
    prisma.payment.findMany({
      where: { booking: { agencyId }, status: "REFUNDED", ...paymentDateFilter(window) },
      select: { amount: true },
    }),

    /* ── Metrics: distinct paid bookings (for panier moyen) ── */
    prisma.payment.findMany({
      where: { booking: { agencyId }, status: "PAID", ...paymentDateFilter(window) },
      select: { bookingId: true },
      distinct: ["bookingId"],
    }),

    /* ── Metrics: active vehicles ── */
    prisma.vehicle.count({
      where: { agencyId, status: { not: "UNAVAILABLE" } },
    }),

    /* ── Vehicles for AddExpenseDialog ── */
    prisma.vehicle.findMany({
      where: { agencyId },
      select: { id: true, make: true, model: true, plate: true },
      orderBy: [{ make: "asc" }, { model: "asc" }],
    }),
  ]);

  /* ── Compute derived values ── */

  const revenuePeriod = Number(revenueAgg._sum.amount ?? 0);
  const expensesPeriod = Number(expensesAgg._sum.amount ?? 0);
  const netProfit = revenuePeriod - expensesPeriod;

  const cashIncome = Number(cashIncomeAgg._sum.amount ?? 0);
  const cashExpense = Number(cashExpenseAgg._sum.amount ?? 0);
  const cashInHand = cashIncome - cashExpense;

  // Previous period
  const prevRevenue = Number(prevRevenueAgg._sum.amount ?? 0);
  const prevExpenses = Number(prevExpensesAgg._sum.amount ?? 0);
  const prevNet = prevRevenue - prevExpenses;
  const prevCashIn = Number(prevCashIncomeAgg._sum.amount ?? 0);
  const prevCashOut = Number(prevCashExpenseAgg._sum.amount ?? 0);
  const prevCash = prevCashIn - prevCashOut;

  // Deltas
  const cashDelta = deltaPercent(cashInHand, prevCash);
  const netDelta = deltaPercent(netProfit, prevNet);

  // Revenue per vehicle (group in JS)
  const vehicleRevenueMap = new Map<string, number>();
  for (const p of vehiclePayments) {
    const name = `${p.booking.vehicle.make} ${p.booking.vehicle.model}`;
    vehicleRevenueMap.set(name, (vehicleRevenueMap.get(name) ?? 0) + Number(p.amount));
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
  const unpaidAmount = unpaidBookings.reduce((sum, b) => sum + Number(b.remainingAmount), 0);
  const unpaidCount = unpaidBookings.length;

  // Deposits held
  const depositsHeld = Number(depositsHeldAgg._sum.amount ?? 0);

  // Refunds pending
  const refundsPending = refundedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const refundsPendingCount = refundedPayments.length;

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
  const paidBookingsTotal = paidBookingsCount.length;
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
