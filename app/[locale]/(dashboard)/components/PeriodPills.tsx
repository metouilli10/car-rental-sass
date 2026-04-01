import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { DashboardPeriod, getPeriodBounds } from "@/lib/dashboard-periods";

interface PeriodPillsProps {
  agencyId: string;
  selectedPeriod: DashboardPeriod;
}

const periodItems: { id: DashboardPeriod; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "tomorrow", label: "Demain" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
];

export async function PeriodPills({ agencyId, selectedPeriod }: PeriodPillsProps) {
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
    <section aria-label="Filtre période opérationnelle">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Période
        </label>
        {/* Segmented control — premium pill design */}
        <div className="inline-flex gap-0.5 overflow-x-auto rounded-lg bg-gray-100 p-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {periodItems.map((period) => {
            const isActive = selectedPeriod === period.id;
            const periodCount = counts.find((item) => item.id === period.id);

            return (
              <Link
                key={period.id}
                href={`/dashboard?period=${period.id}`}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  isActive
                    ? "border border-gray-200 bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:bg-white/60 hover:text-gray-800"
                )}
              >
                {period.label}
                <span className="ml-1.5 text-[11px] font-normal text-gray-400">
                  {periodCount?.departures ?? 0}↑ {periodCount?.returns ?? 0}↓
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
