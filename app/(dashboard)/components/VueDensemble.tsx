import { prisma } from "@/lib/prisma";
import { formatCurrency, cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import { FlatIcon } from "@/components/shared/flat-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CashFlowSummaryWrapper } from "./CashFlowSummaryWrapper";

function Sparkline({ data, height = 36, className }: { data: number[]; height?: number; className?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 120;
  const padding = 2;
  const points = data.map((v, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });
  const pathD = points.length === 1 ? `M ${points[0]} L ${width - padding},${points[0].split(",")[1]}` : `M ${points.join(" L ")}`;
  return (
    <svg
      width={width}
      height={height}
      className={className}
      aria-hidden
    >
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-500"
      />
    </svg>
  );
}

export async function VueDensemble({ agencyId }: { agencyId: string }) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Last month date range for trend comparison
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  endOfLastMonth.setHours(23, 59, 59, 999);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [
    // Vehicle status -- single groupBy replaces 4 individual count queries
    vehicleStatusCounts,

    // This month KPIs
    monthRevenue,
    monthBookings,
    monthCompletedBookings,

    // Last month revenue for trend
    lastMonthRevenue,

    // Daily revenue this month (for sparkline)
    paymentsThisMonth,
  ] = await Promise.all([
    prisma.vehicle.groupBy({
      by: ["status"],
      where: { agencyId },
      _count: { id: true },
    }),

    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),

    prisma.booking.count({
      where: {
        agencyId,
        createdAt: { gte: startOfMonth },
      },
    }),

    prisma.booking.count({
      where: {
        agencyId,
        status: "COMPLETED",
        updatedAt: { gte: startOfMonth },
      },
    }),

    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "PAID",
        paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    }),

    prisma.payment.findMany({
      where: {
        booking: { agencyId },
        status: "PAID",
        paidAt: { gte: startOfMonth, lte: endOfToday },
      },
      select: { amount: true, paidAt: true },
    }),
  ]);

  // Build daily revenue series for sparkline (day 1 .. today)
  const daysInMonthSoFar = now.getDate();
  const dailyRevenue: number[] = Array.from({ length: daysInMonthSoFar }, () => 0);
  for (const p of paymentsThisMonth) {
    const dayIndex = new Date(p.paidAt!).getDate() - 1;
    if (dayIndex >= 0 && dayIndex < daysInMonthSoFar) {
      dailyRevenue[dayIndex] += p.amount;
    }
  }

  // Derive counts from the single groupBy result
  const statusMap = Object.fromEntries(
    vehicleStatusCounts.map((s) => [s.status, s._count.id])
  );
  const availableVehicles = statusMap["AVAILABLE"] || 0;
  const rentedVehicles = statusMap["RENTED"] || 0;
  const maintenanceVehicles = statusMap["MAINTENANCE"] || 0;
  const totalVehicles = vehicleStatusCounts.reduce((sum, s) => sum + s._count.id, 0);

  const utilization =
    totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;
  const monthlyRevenue = monthRevenue._sum.amount || 0;
  const lastMonthRevenueAmount = lastMonthRevenue._sum.amount || 0;

  // Calculate trend
  const hasTrend = lastMonthRevenueAmount > 0;
  const trendPercentage = hasTrend
    ? Math.round(((monthlyRevenue - lastMonthRevenueAmount) / lastMonthRevenueAmount) * 100)
    : 0;
  const isUp = trendPercentage >= 0;

  const completionRate =
    monthBookings > 0
      ? Math.round((monthCompletedBookings / monthBookings) * 100)
      : 0;

  return (
    <div className="space-y-section-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-card-gap">
        {/* Vehicle Status Summary */}
        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">
                État du Parc
              </CardTitle>
              <FlatIcon name="car" size={22} />
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* Utilization - prominent display */}
            <div>
              <div className="flex items-baseline justify-between mb-2.5">
                <span className="text-xs font-medium text-muted-foreground/45 uppercase tracking-wider">
                  Taux d&apos;utilisation
                </span>
                <span className="text-2xl font-bold text-foreground tabular-nums">
                  {utilization}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>

            {/* Status breakdown */}
            <div className="space-y-1.5">
              <Link
                href="/vehicles?status=RENTED"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors duration-200 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-sm text-foreground/90">En location</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {rentedVehicles}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link
                href="/vehicles?status=AVAILABLE"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors duration-200 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm text-foreground/90">Disponibles</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {availableVehicles}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link
                href="/vehicles?status=MAINTENANCE"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors duration-200 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm text-foreground/90">Maintenance</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {maintenanceVehicles}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Caisse du jour (Cash flow) - Using CashFlowSummaryWrapper */}
        <CashFlowSummaryWrapper agencyId={agencyId} />

        {/* This Month KPIs */}
        <Card className="shadow-md bg-white">
          <CardHeader className="pb-3 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">
                Ce Mois
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-muted-foreground/60" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pt-4 space-y-6">
            {/* Revenue - prominent with sparkline */}
            <div>
              <p className="text-xs font-medium text-muted-foreground/45 uppercase tracking-wider mb-4">
                Chiffre d&apos;affaires
              </p>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="text-[2rem] font-bold text-foreground tabular-nums tracking-tight leading-[30px]">
                      {formatCurrency(monthlyRevenue)}
                    </p>
                    {hasTrend && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs flex items-center gap-1 border-0 transition-colors duration-200",
                          isUp ? "bg-emerald-50/60 text-emerald-600/90" : "bg-red-50/40 text-red-600/80"
                        )}
                      >
                        {isUp ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {isUp ? "+" : ""}
                        {trendPercentage}%
                      </Badge>
                    )}
                  </div>
                  {hasTrend && (
                    <p className="text-xs text-muted-foreground/45 mt-2">
                      vs {formatCurrency(lastMonthRevenueAmount)} le mois dernier
                    </p>
                  )}
                </div>
                {dailyRevenue.length > 0 && (
                  <div className="shrink-0 flex flex-col items-end">
                    <Sparkline data={dailyRevenue} height={40} className="opacity-80" />
                    <span className="text-[10px] text-muted-foreground/65 mt-1 uppercase tracking-wider">
                      Jours
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bookings stats */}
            <div className="grid grid-cols-2 gap-5 pt-5 border-t border-border/40">
              <div>
                <p className="text-xs font-medium text-muted-foreground/45 uppercase tracking-wider mb-2">
                  Réservations
                </p>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {monthBookings}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground/45 uppercase tracking-wider mb-2">
                  Complétées
                </p>
                <p className="text-2xl font-bold text-emerald-600/90 tabular-nums">
                  {monthCompletedBookings}
                </p>
              </div>
            </div>

            {/* Completion rate bar */}
            <div className="pt-5 border-t border-border/40">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground/45 uppercase tracking-wider">
                  Taux de complétion
                </span>
                <span className="text-lg font-bold text-foreground tabular-nums">
                  {completionRate}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
