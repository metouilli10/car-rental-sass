import { prisma } from "@/lib/prisma";
import { DashboardPeriod, getPeriodBounds, getPeriodLabel } from "@/lib/dashboard-periods";
import { formatKpiInteger, formatKpiRatio, formatMadKpi } from "@/lib/kpi-formatters";
import {
  calculateFinanceTotals,
  resolveRetainedDepositAmount,
} from "@/lib/dashboard/finance";
import { MetricCard, type MetricCardData } from "./MetricCard";

interface TopMetricsProps {
  agencyId: string;
  period: DashboardPeriod;
}

function getPreviousBounds(start: Date, end: Date) {
  const duration = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);
  return { previousStart, previousEnd };
}

function getTrendLabel(current: number, previous: number) {
  if (previous <= 0 && current <= 0) {
    return { text: "Stable vs période précédente", tone: "neutral" as const };
  }
  if (previous <= 0 && current > 0) {
    return { text: "+100% vs période précédente", tone: "positive" as const };
  }

  const delta = ((current - previous) / previous) * 100;
  if (delta > 0) {
    return { text: `+${Math.round(delta)}% vs période précédente`, tone: "positive" as const };
  }
  if (delta < 0) {
    return { text: `${Math.round(delta)}% vs période précédente`, tone: "negative" as const };
  }

  return { text: "0% vs période précédente", tone: "neutral" as const };
}

export async function TopMetrics({ agencyId, period }: TopMetricsProps) {
  const { start, end } = getPeriodBounds(period);
  const { previousStart, previousEnd } = getPreviousBounds(start, end);

  const [
    vehicleStatusCounts,
    currentBookedVehicles,
    previousBookedVehicles,
    currentBookings,
    previousBookings,
    currentRevenue,
    previousRevenue,
    currentRefunds,
    previousRefunds,
    currentCashExpenses,
    previousCashExpenses,
    currentDepositReleases,
    previousDepositReleases,
  ] = await Promise.all([
    prisma.vehicle.groupBy({
      by: ["status"],
      where: { agencyId },
      _count: { id: true },
    }),
    prisma.booking.findMany({
      where: {
        agencyId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      distinct: ["vehicleId"],
      select: { vehicleId: true },
    }),
    prisma.booking.findMany({
      where: {
        agencyId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        startDate: { lte: previousEnd },
        endDate: { gte: previousStart },
      },
      distinct: ["vehicleId"],
      select: { vehicleId: true },
    }),
    prisma.booking.count({
      where: {
        agencyId,
        createdAt: { gte: start, lte: end },
        status: { not: "CANCELED" },
      },
    }),
    prisma.booking.count({
      where: {
        agencyId,
        createdAt: { gte: previousStart, lte: previousEnd },
        status: { not: "CANCELED" },
      },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "PAID",
        category: "RENTAL",
        paidAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "PAID",
        category: "RENTAL",
        paidAt: { gte: previousStart, lte: previousEnd },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "REFUNDED",
        category: "REFUND",
        updatedAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "REFUNDED",
        category: "REFUND",
        updatedAt: { gte: previousStart, lte: previousEnd },
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        agencyId,
        method: "CASH",
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        agencyId,
        method: "CASH",
        date: { gte: previousStart, lte: previousEnd },
      },
      _sum: { amount: true },
    }),
    prisma.deposit.findMany({
      where: {
        booking: { agencyId },
        status: { in: ["RETURNED", "PARTIAL_RETURNED", "FORFEITED"] },
        returnedAt: { gte: start, lte: end },
      },
      select: {
        amount: true,
        status: true,
        booking: {
          select: {
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
    }),
    prisma.deposit.findMany({
      where: {
        booking: { agencyId },
        status: { in: ["RETURNED", "PARTIAL_RETURNED", "FORFEITED"] },
        returnedAt: { gte: previousStart, lte: previousEnd },
      },
      select: {
        amount: true,
        status: true,
        booking: {
          select: {
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
    }),
  ]);

  const totalVehicles = vehicleStatusCounts.reduce((sum, row) => sum + row._count.id, 0);
  const occupiedVehicles = currentBookedVehicles.length;
  const previousOccupiedVehicles = previousBookedVehicles.length;
  const occupiedRate = totalVehicles > 0 ? Math.round((occupiedVehicles / totalVehicles) * 100) : 0;
  const previousOccupiedRate =
    totalVehicles > 0 ? Math.round((previousOccupiedVehicles / totalVehicles) * 100) : 0;

  const revenueNow = currentRevenue._sum.amount ?? 0;
  const revenuePrevious = previousRevenue._sum.amount ?? 0;
  const refundsNow = currentRefunds._sum.amount ?? 0;
  const refundsPrevious = previousRefunds._sum.amount ?? 0;
  const profitNow = calculateFinanceTotals({
    rentalPayments: [{ amount: revenueNow }],
    refunds: [{ amount: refundsNow }],
    cashExpenses: [{ amount: Number(currentCashExpenses._sum.amount ?? 0) }],
    heldDeposits: [],
    releasedDeposits: currentDepositReleases.map((deposit) => ({
      amount: deposit.amount,
      status: deposit.status,
      retainedAmount: resolveRetainedDepositAmount(
        deposit.amount,
        deposit.booking.damageReports
      ),
    })),
  }).earnedNet;
  const profitPrevious = calculateFinanceTotals({
    rentalPayments: [{ amount: revenuePrevious }],
    refunds: [{ amount: refundsPrevious }],
    cashExpenses: [{ amount: Number(previousCashExpenses._sum.amount ?? 0) }],
    heldDeposits: [],
    releasedDeposits: previousDepositReleases.map((deposit) => ({
      amount: deposit.amount,
      status: deposit.status,
      retainedAmount: resolveRetainedDepositAmount(
        deposit.amount,
        deposit.booking.damageReports
      ),
    })),
  }).earnedNet;

  const occupationTrend = getTrendLabel(occupiedRate, previousOccupiedRate);
  const bookingTrend = getTrendLabel(currentBookings, previousBookings);
  const revenueTrend = getTrendLabel(revenueNow, revenuePrevious);
  const profitTrend = getTrendLabel(profitNow, profitPrevious);

  const cards: MetricCardData[] = [
    {
      id: "occupation",
      label: "Occupation du parc",
      value: formatKpiRatio(occupiedVehicles, totalVehicles),
      subLabel: `${occupiedRate}% sur ${getPeriodLabel(period).toLowerCase()}`,
      insightText: occupationTrend.text,
      insightTone: occupationTrend.tone,
      href: "/vehicles?filter=status",
      icon: "gauge",
      sparkline: [
        Math.max(previousOccupiedVehicles - 2, 0),
        Math.max(previousOccupiedVehicles - 1, 0),
        previousOccupiedVehicles,
        Math.max(occupiedVehicles - 1, 0),
        occupiedVehicles,
        Math.max(occupiedVehicles + 1, 0),
      ],
    },
    {
      id: "locations",
      label: "Locations ce mois",
      value: formatKpiInteger(currentBookings),
      subLabel: `Réservations (${getPeriodLabel(period).toLowerCase()})`,
      insightText: bookingTrend.text,
      insightTone: bookingTrend.tone,
      href: "/bookings?period=current",
      icon: "activity",
      sparkline: [
        Math.max(previousBookings - 2, 0),
        Math.max(previousBookings - 1, 0),
        previousBookings,
        Math.max(currentBookings - 1, 0),
        currentBookings,
        Math.max(currentBookings + 1, 0),
      ],
    },
    {
      id: "ca",
      label: "CA mensuel",
      value: formatMadKpi(revenueNow),
      subLabel: `Encaissements (${getPeriodLabel(period).toLowerCase()})`,
      insightText: revenueTrend.text,
      insightTone: revenueTrend.tone,
      href: "/payments?scope=revenue",
      icon: "revenue",
      sparkline: [
        Math.max(revenuePrevious * 0.55, 1),
        Math.max(revenuePrevious * 0.72, 1),
        Math.max(revenuePrevious, 1),
        Math.max(revenueNow * 0.65, 1),
        Math.max(revenueNow * 0.82, 1),
        Math.max(revenueNow, 1),
      ],
    },
    {
      id: "profit",
      label: "Profit mensuel",
      value: formatMadKpi(profitNow),
      subLabel: "CA + cautions retenues - remboursements - charges cash",
      insightText: profitTrend.text,
      insightTone: profitTrend.tone,
      href: "/payments?scope=profit",
      icon: "profit",
      sparkline: [
        Math.max(profitPrevious * 0.55, 1),
        Math.max(profitPrevious * 0.72, 1),
        Math.max(profitPrevious, 1),
        Math.max(profitNow * 0.65, 1),
        Math.max(profitNow * 0.82, 1),
        Math.max(profitNow, 1),
      ],
    },
  ];

  return (
    <section aria-label="Indicateurs exécutifs">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <MetricCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
