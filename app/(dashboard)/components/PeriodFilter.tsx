import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { DashboardPeriod, getPeriodBounds } from "@/lib/dashboard-periods";

interface PeriodFilterProps {
  agencyId: string;
  selectedPeriod: DashboardPeriod;
}

const periodItems: { id: DashboardPeriod; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "tomorrow", label: "Demain" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
];

export async function PeriodFilter({ agencyId, selectedPeriod }: PeriodFilterProps) {
  const counts = await Promise.all(
    periodItems.map(async ({ id }) => {
      const { start, end } = getPeriodBounds(id);
      const [departures, returns] = await Promise.all([
        prisma.booking.count({
          where: {
            agencyId,
            status: { in: ["CONFIRMED", "ACTIVE"] },
            startDate: { gte: start, lte: end },
          },
        }),
        prisma.booking.count({
          where: {
            agencyId,
            status: { in: ["CONFIRMED", "ACTIVE"] },
            endDate: { gte: start, lte: end },
          },
        }),
      ]);

      return { id, departures, returns };
    })
  );

  return (
    <section aria-label="Filtre global de période">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Période globale</p>
          <p className="text-xs text-muted-foreground">Tous les widgets suivent ce filtre</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {periodItems.map((period) => {
            const isActive = selectedPeriod === period.id;
            const periodCount = counts.find((item) => item.id === period.id);

            return (
              <Link
                key={period.id}
                href={`/dashboard?period=${period.id}`}
                className={cn(
                  "group inline-flex min-w-[155px] flex-col rounded-xl border px-3.5 py-2.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <span className="text-sm font-medium">{period.label}</span>
                <span
                  className={cn(
                    "mt-1 text-xs",
                    isActive ? "text-blue-100" : "text-slate-500 group-hover:text-slate-600"
                  )}
                >
                  {periodCount?.departures ?? 0} départs · {periodCount?.returns ?? 0} retours
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
