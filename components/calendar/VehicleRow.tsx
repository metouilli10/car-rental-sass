"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { Car } from "lucide-react";
import type { CalendarVehicle } from "@/lib/actions/calendar";

interface VehicleRowProps {
  vehicle: CalendarVehicle;
}

export function VehicleRow({ vehicle }: VehicleRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 border-b border-r border-border bg-card min-h-[80px]">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
        <Car className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm truncate">
          {vehicle.make} {vehicle.model}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {vehicle.plate}
        </div>
        <div className="mt-1">
          <StatusBadge status={vehicle.status as "AVAILABLE" | "RENTED" | "MAINTENANCE" | "UNAVAILABLE"} />
        </div>
      </div>
    </div>
  );
}
