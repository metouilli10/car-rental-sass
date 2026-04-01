import Link from "next/link";
import { TrendingUp, CarFront } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { CashFlowSummaryWrapper } from "./CashFlowSummaryWrapper";

interface OverviewGridProps {
  agencyId: string;
}

export async function OverviewGrid({ agencyId }: OverviewGridProps) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [vehicleStatusCounts, monthRevenue, monthBookings, monthCompletedBookings] = await Promise.all([
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
  ]);

  const totalVehicles = vehicleStatusCounts.reduce((sum, row) => sum + row._count.id, 0);
  const rentedVehicles =
    vehicleStatusCounts.find((row) => row.status === "RENTED")?._count.id ?? 0;
  const availableVehicles =
    vehicleStatusCounts.find((row) => row.status === "AVAILABLE")?._count.id ?? 0;
  const maintenanceVehicles =
    vehicleStatusCounts.find((row) => row.status === "MAINTENANCE")?._count.id ?? 0;

  const utilization =
    totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;
  const completionRate =
    monthBookings > 0 ? Math.round((monthCompletedBookings / monthBookings) * 100) : 0;

  return (
    <section aria-label="Vue d'ensemble analytique">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* ── État du parc ── */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900">État du parc</h3>
            <CarFront className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4 p-5">
            {/* Utilization bar */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">Utilisation</p>
                <p className="text-base font-semibold text-gray-900">{utilization}%</p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>

            {/* Status grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <Link href="/vehicles?status=RENTED" className="rounded-lg bg-gray-50 p-2 transition-colors hover:bg-gray-100">
                <p className="text-xs text-gray-500">Loués</p>
                <p className="text-base font-semibold text-gray-900">{rentedVehicles}</p>
              </Link>
              <Link href="/vehicles?status=AVAILABLE" className="rounded-lg bg-gray-50 p-2 transition-colors hover:bg-gray-100">
                <p className="text-xs text-gray-500">Disponibles</p>
                <p className="text-base font-semibold text-gray-900">{availableVehicles}</p>
              </Link>
              <Link href="/vehicles?status=MAINTENANCE" className="rounded-lg bg-gray-50 p-2 transition-colors hover:bg-gray-100">
                <p className="text-xs text-gray-500">Maintenance</p>
                <p className="text-base font-semibold text-gray-900">{maintenanceVehicles}</p>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Caisse du jour (unchanged internals) ── */}
        <CashFlowSummaryWrapper agencyId={agencyId} />

        {/* ── Ce mois ── */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900">Ce mois</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3 p-5">
            {/* CA box */}
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Chiffre d&apos;affaires</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {formatCurrency(monthRevenue._sum.amount ?? 0)}
              </p>
            </div>

            {/* Réservations + Complétées */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Réservations</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{monthBookings}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Complétées</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{monthCompletedBookings}</p>
              </div>
            </div>

            {/* Completion rate */}
            <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <p className="text-sm text-gray-500">Taux de complétion</p>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600">
                {completionRate}%
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
