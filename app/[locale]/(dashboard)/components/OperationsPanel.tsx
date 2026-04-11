import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CalendarDays } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { DashboardPeriod, getPeriodBounds, getPeriodLabel } from "@/lib/dashboard-periods";
import { cn, formatDate, formatTime } from "@/lib/utils";

interface OperationsPanelProps {
  agencyId: string;
  period: DashboardPeriod;
}

export async function OperationsPanel({ agencyId, period }: OperationsPanelProps) {
  const { start, end } = getPeriodBounds(period);

  const bookings = await prisma.booking.findMany({
    where: {
      agencyId,
      status: { in: ["CONFIRMED", "ACTIVE"] },
      OR: [
        { startDate: { gte: start, lte: end } },
        { endDate: { gte: start, lte: end } },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      customer: { select: { name: true } },
      vehicle: { select: { make: true, model: true, plate: true } },
      damageReports: { select: { id: true }, take: 1, orderBy: { reportedAt: "desc" } },
    },
    orderBy: { startDate: "asc" },
  });

  const operations = bookings
    .flatMap((booking) => {
      const rows: Array<{
        id: string;
        type: "depart" | "retour";
        date: Date;
        booking: typeof booking;
      }> = [];

      if (booking.startDate >= start && booking.startDate <= end) {
        rows.push({ id: `${booking.id}-depart`, type: "depart", date: booking.startDate, booking });
      }
      if (booking.endDate >= start && booking.endDate <= end) {
        rows.push({ id: `${booking.id}-retour`, type: "retour", date: booking.endDate, booking });
      }
      return rows;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const departureCount = operations.filter((op) => op.type === "depart").length;
  const returnCount    = operations.filter((op) => op.type === "retour").length;

  return (
    /* h-full fills the grid column to match ActionRequiredPanel height */
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Opérations</h3>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {getPeriodLabel(period)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          {formatDate(new Date())} — {departureCount} départ{departureCount !== 1 ? "s" : ""},{" "}
          {returnCount} retour{returnCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Scrollable operation list */}
      <div className="flex-1 divide-y divide-gray-50 overflow-y-auto">
        {operations.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
              <CalendarDays className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">Aucune opération planifiée</p>
          </div>
        ) : (
          operations.map((op) => {
            const isDepart = op.type === "depart";
            const hasInspection = op.booking.damageReports.length > 0;
            const actionHref = isDepart
              ? `/bookings/${op.booking.id}`
              : hasInspection
                ? `/damage-reports/${op.booking.damageReports[0].id}`
                : `/damage-reports/new?bookingId=${op.booking.id}`;

            return (
              /* Each row is a full-width Link — no separate action button needed */
              <Link
                key={op.id}
                href={actionHref}
                className="flex items-center gap-2.5 p-3 transition-colors hover:bg-gray-50"
              >
                {/* Time */}
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-gray-400">
                  {formatTime(op.date)}
                </span>

                {/* Direction icon circle */}
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                    isDepart ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                  )}
                >
                  {isDepart ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                  )}
                </div>

                {/* Client + vehicle */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {op.booking.customer.name}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {op.booking.vehicle.make} {op.booking.vehicle.model}
                  </p>
                </div>

                {/* Type tag */}
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                    isDepart
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-blue-50 text-blue-700"
                  )}
                >
                  {isDepart ? "Départ" : "Retour"}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
