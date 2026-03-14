import { Activity, CircleDollarSign, Gauge, TrendingUp } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  calculateFinanceTotals,
  resolveRetainedDepositAmount,
} from "@/lib/dashboard/finance";
import { formatKpiInteger, formatKpiRatio, formatMadKpi } from "@/lib/kpi-formatters";
import { cn } from "@/lib/utils";

interface KpiRowProps {
  agencyId: string;
}

interface ExecutiveKpi {
  id: string;
  label: string;
  value: string;
  subLabel: string;
  icon: typeof Gauge;
  color: "violet" | "blue" | "emerald" | "amber";
  isOccupation?: boolean;
  occupationRate?: number;
  trend?: string; // placeholder — undefined means hidden
}

// Static colorMap — full class strings required for Tailwind static analysis
const colorMap = {
  violet:  { bg: "bg-violet-50",  icon: "text-violet-500",  bar: "bg-violet-500"  },
  blue:    { bg: "bg-blue-50",    icon: "text-blue-500",    bar: "bg-blue-500"    },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-500", bar: "bg-emerald-500" },
  amber:   { bg: "bg-amber-50",   icon: "text-amber-500",   bar: "bg-amber-500"   },
} as const;

function KpiCard({ item }: { item: ExecutiveKpi }) {
  const Icon = item.icon;
  const colors = colorMap[item.color];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        {/* Left: label + value + sublabel */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
            {item.value}
          </p>
          <p className="mt-1 text-xs text-gray-400">{item.subLabel}</p>
        </div>

        {/* Right: tinted icon circle + optional trend chip */}
        <div className="ml-3 flex shrink-0 flex-col items-end gap-2">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", colors.bg)}>
            <Icon className={cn("h-5 w-5", colors.icon)} />
          </div>
          {item.trend && (
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-600">
              {item.trend}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar — occupation card only */}
      {item.isOccupation && item.occupationRate !== undefined && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn("h-full rounded-full transition-all", colors.bar)}
            style={{ width: `${item.occupationRate}%` }}
          />
        </div>
      )}
    </div>
  );
}

export async function KpiRow({ agencyId }: KpiRowProps) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    vehicleStatusCounts,
    monthlyBookings,
    monthlyRevenue,
    monthlyRefunds,
    monthlyCashExpenses,
    monthlyDepositReleases,
  ] = await Promise.all([
    prisma.vehicle.groupBy({
      by: ["status"],
      where: { agencyId },
      _count: { id: true },
    }),
    prisma.booking.count({
      where: {
        agencyId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: "CANCELED" },
      },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "PAID",
        category: "RENTAL",
        paidAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "REFUNDED",
        category: "REFUND",
        updatedAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        agencyId,
        method: "CASH",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.deposit.findMany({
      where: {
        booking: { agencyId },
        status: { in: ["RETURNED", "PARTIAL_RETURNED", "FORFEITED"] },
        returnedAt: { gte: startOfMonth, lte: endOfMonth },
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
  const rentedVehicles =
    vehicleStatusCounts.find((row) => row.status === "RENTED")?._count.id ?? 0;
  const occupationRate = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

  const caMensuel = monthlyRevenue._sum.amount ?? 0;
  const refunded = monthlyRefunds._sum.amount ?? 0;
  const profitMensuel = calculateFinanceTotals({
    rentalPayments: [{ amount: caMensuel }],
    refunds: [{ amount: refunded }],
    cashExpenses: [{ amount: Number(monthlyCashExpenses._sum.amount ?? 0) }],
    heldDeposits: [],
    releasedDeposits: monthlyDepositReleases.map((deposit) => ({
      amount: deposit.amount,
      status: deposit.status,
      retainedAmount: resolveRetainedDepositAmount(
        deposit.amount,
        deposit.booking.damageReports
      ),
    })),
  }).earnedNet;

  const items: ExecutiveKpi[] = [
    {
      id: "occupation",
      label: "Occupation du parc",
      value: formatKpiRatio(rentedVehicles, totalVehicles),
      subLabel: `${occupationRate}% d'utilisation`,
      icon: Gauge,
      color: "violet",
      isOccupation: true,
      occupationRate,
    },
    {
      id: "locations",
      label: "Locations ce mois",
      value: formatKpiInteger(monthlyBookings),
      subLabel: "Réservations confirmées",
      icon: Activity,
      color: "blue",
    },
    {
      id: "ca",
      label: "CA mensuel",
      value: formatMadKpi(caMensuel),
      subLabel: "Encaissements location",
      icon: CircleDollarSign,
      color: "emerald",
    },
    {
      id: "profit",
      label: "Profit mensuel",
      value: formatMadKpi(profitMensuel),
      subLabel: "CA + cautions retenues − remboursements − charges cash",
      icon: TrendingUp,
      color: "amber",
    },
  ];

  return (
    <section aria-label="Indicateurs exécutifs">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <KpiCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
