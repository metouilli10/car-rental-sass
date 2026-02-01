import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  Car,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Wrench,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CashFlowSummaryWrapper } from "./CashFlowSummaryWrapper";

export async function VueDensemble({ agencyId }: { agencyId: string }) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Last month date range for trend comparison
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  endOfLastMonth.setHours(23, 59, 59, 999);

  const [
    // Vehicle status
    availableVehicles,
    rentedVehicles,
    maintenanceVehicles,
    totalVehicles,

    // This month KPIs
    monthRevenue,
    monthBookings,
    monthCompletedBookings,

    // Last month revenue for trend
    lastMonthRevenue,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { agencyId, status: "AVAILABLE" } }),
    prisma.vehicle.count({ where: { agencyId, status: "RENTED" } }),
    prisma.vehicle.count({ where: { agencyId, status: "MAINTENANCE" } }),
    prisma.vehicle.count({ where: { agencyId } }),

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
  ]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-gray-500" />
        <h2 className="text-xl font-bold text-gray-900">Vue d&apos;ensemble</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vehicle Status Summary */}
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-100 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">
                État du Parc
              </CardTitle>
              <Car className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Utilization bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Taux d&apos;utilisation</span>
                <span className="text-sm font-bold text-gray-900">
                  {utilization}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>

            {/* Status breakdown */}
            <div className="space-y-2">
              <Link
                href="/vehicles?status=RENTED"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm text-gray-700">En location</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {rentedVehicles}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link
                href="/vehicles?status=AVAILABLE"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm text-gray-700">Disponibles</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {availableVehicles}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link
                href="/vehicles?status=MAINTENANCE"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm text-gray-700">Maintenance</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {maintenanceVehicles}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Caisse du jour (Cash flow) - Using CashFlowSummaryWrapper */}
        <CashFlowSummaryWrapper agencyId={agencyId} />

        {/* This Month KPIs */}
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-100 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">
                Ce Mois
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Revenue */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Chiffre d&apos;affaires</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(monthlyRevenue)}
                </p>
                {hasTrend && (
                  <Badge
                    variant={isUp ? "success" : "destructive"}
                    className="text-xs flex items-center gap-1"
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
                <p className="text-xs text-gray-500 mt-1">
                  vs {formatCurrency(lastMonthRevenueAmount)} le mois dernier
                </p>
              )}
            </div>

            {/* Bookings stats */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-1">Réservations</p>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-base font-bold">
                    {monthBookings}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Complétées</p>
                <div className="flex items-center gap-1.5">
                  <Badge variant="success" className="text-base font-bold">
                    {monthCompletedBookings}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Completion rate */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Taux de complétion
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {monthBookings > 0
                    ? Math.round(
                        (monthCompletedBookings / monthBookings) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
