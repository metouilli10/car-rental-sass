import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardPeriod } from "@/lib/dashboard/ranges";
import type { PeriodStatsMap } from "@/lib/dashboard/types";

const PERIOD_ITEMS: { id: DashboardPeriod; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "tomorrow", label: "Demain" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
];

interface PeriodFilterBarProps {
  selectedPeriod: DashboardPeriod;
  stats: PeriodStatsMap;
}

export function PeriodFilterBar({ selectedPeriod, stats }: PeriodFilterBarProps) {
  const selectedStats = stats[selectedPeriod];

  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:translate-y-0 hover:shadow-sm">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          {PERIOD_ITEMS.map((item) => {
            const active = item.id === selectedPeriod;
            return (
              <Link
                key={item.id}
                href={`/dashboard?period=${item.id}`}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="rounded-full">
            {selectedStats.departures} departs
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {selectedStats.returns} retours
          </Badge>
          <Badge
            variant={selectedStats.lateReturns > 0 ? "warning" : "outline"}
            className="rounded-full"
          >
            {selectedStats.lateReturns} retards
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
