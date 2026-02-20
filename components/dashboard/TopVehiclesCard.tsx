import { Award, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { TopVehiclesData } from "@/lib/dashboard/types";

interface TopVehiclesCardProps {
  data?: TopVehiclesData;
}

export function TopVehiclesCard({ data }: TopVehiclesCardProps) {
  if (!data) {
    return null;
  }

  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:translate-y-0 hover:shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">Top vehicules ce mois</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <Award className="h-4 w-4 text-emerald-600" />
            Top 3 revenus
          </div>
          {data.topRevenue.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune donnee disponible.</p>
          ) : (
            data.topRevenue.map((vehicle) => (
              <div key={vehicle.vehicleId} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">
                  {vehicle.label} - {vehicle.plate}
                </p>
                <Badge variant="success" className="mt-1">
                  {formatCurrency(vehicle.revenue)}
                </Badge>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <Gauge className="h-4 w-4 text-amber-600" />
            Bottom 3 utilisation
          </div>
          {data.bottomUtilization.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune donnee disponible.</p>
          ) : (
            data.bottomUtilization.map((vehicle) => (
              <div key={vehicle.vehicleId} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">
                  {vehicle.label} - {vehicle.plate}
                </p>
                <Badge variant="warning" className="mt-1">
                  {vehicle.utilizationRate}%
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
