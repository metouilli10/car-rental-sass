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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {periodItems.map((period) => {
            const isActive = selectedPeriod === period.id;
            const periodCount = counts.find((item) => item.id === period.id);

            return (
              <Link
                key={period.id}
                href={`/dashboard?period=${period.id}`}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-xl border border-border p-4 transition-all duration-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isActive
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "bg-muted/40 text-foreground hover:bg-muted"
                )}
              >
                <span className="text-sm font-semibold">{period.label}</span>
                <span className="inline-flex items-baseline gap-1">
                  <span className="text-lg font-bold leading-none">{periodCount?.departures ?? 0}</span>
                  <span className={cn("text-xs", isActive ? "text-white/80" : "text-muted-foreground")}>
                    départs
                  </span>
                </span>
                <span className="inline-flex items-baseline gap-1">
                  <span className="text-lg font-bold leading-none">{periodCount?.returns ?? 0}</span>
                  <span className={cn("text-xs", isActive ? "text-white/80" : "text-muted-foreground")}>
                    retours
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
