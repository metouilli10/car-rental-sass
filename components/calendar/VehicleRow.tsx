"use client";

import Image from "next/image";
import { StatusBadge } from "@/components/shared/status-badge";
import { brandKeyFromMake, brandLogoSrc } from "@/lib/brands";
import type { CalendarVehicle } from "@/lib/actions/calendar";
import { cn } from "@/lib/utils";

interface VehicleRowProps {
  vehicle: CalendarVehicle;
}

export function VehicleRow({ vehicle }: VehicleRowProps) {
  const logoSrc = brandLogoSrc(brandKeyFromMake(vehicle.make));
  const statusBackgroundClass = {
    AVAILABLE: "bg-emerald-50",
    RENTED: "bg-blue-50",
    MAINTENANCE: "bg-red-50",
    UNAVAILABLE: "bg-red-50",
  }[vehicle.status as "AVAILABLE" | "RENTED" | "MAINTENANCE" | "UNAVAILABLE"] ?? "bg-card";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 border-b border-r border-border min-h-[80px]",
        statusBackgroundClass
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <div className="relative h-6 w-6">
          <Image
            src={logoSrc}
            alt={`${vehicle.make} logo`}
            fill
            className="object-contain"
            sizes="24px"
          />
        </div>
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
