import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { MonthPerformanceData } from "@/lib/dashboard/types";

interface MonthPerformanceCardProps {
  data: MonthPerformanceData;
}

export function MonthPerformanceCard({ data }: MonthPerformanceCardProps) {
  return (
    <Card className="h-full rounded-xl border border-slate-200 bg-white shadow-sm hover:translate-y-0 hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">Ce mois</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">CA du mois</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(data.revenueMonth)}</p>
          <p className="mt-1 text-xs text-muted-foreground" title={data.caHintText}>
            {data.caHintText}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">Reservations</p>
            <p className="text-xl font-semibold text-slate-900">{data.reservationsMonth}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">Taux de completion</p>
            <p className="text-xl font-semibold text-slate-900">{data.completionRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Badge variant="outline" className="justify-center rounded-lg py-2">
            CA/vehicule: {formatCurrency(data.revenuePerVehicle)}
          </Badge>
          <Badge variant="outline" className="justify-center rounded-lg py-2">
            Duree moyenne: {data.averageRentalDays} j
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
