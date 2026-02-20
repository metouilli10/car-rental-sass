import { CarFront } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParkStatus } from "@/lib/dashboard/types";

interface ParkStatusCardProps {
  status: ParkStatus;
}

export function ParkStatusCard({ status }: ParkStatusCardProps) {
  const rentedPct = status.total > 0 ? Math.round((status.rented / status.total) * 100) : 0;
  const availablePct = status.total > 0 ? Math.round((status.available / status.total) * 100) : 0;
  const maintenancePct =
    status.total > 0 ? Math.round((status.maintenance / status.total) * 100) : 0;

  const donutStyle = {
    background: `conic-gradient(
      #2563eb 0% ${rentedPct}%,
      #16a34a ${rentedPct}% ${rentedPct + availablePct}%,
      #f59e0b ${rentedPct + availablePct}% ${rentedPct + availablePct + maintenancePct}%,
      #cbd5e1 ${rentedPct + availablePct + maintenancePct}% 100%
    )`,
  };

  return (
    <Card className="h-full rounded-xl border border-slate-200 bg-white shadow-sm hover:translate-y-0 hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">Etat du parc</CardTitle>
          <CarFront className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative h-36 w-36 rounded-full p-3" style={donutStyle}>
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
              <p className="text-3xl font-semibold text-slate-900">{status.occupationRate}%</p>
              <p className="text-xs text-muted-foreground">Occupation</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Badge variant="info" className="justify-center rounded-lg py-1.5">
            Loues: {status.rented}
          </Badge>
          <Badge variant="success" className="justify-center rounded-lg py-1.5">
            Disponibles: {status.available}
          </Badge>
          <Badge variant="warning" className="justify-center rounded-lg py-1.5">
            Maintenance: {status.maintenance}
          </Badge>
          <Badge variant="secondary" className="justify-center rounded-lg py-1.5">
            Indisponibles: {status.unavailable}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
