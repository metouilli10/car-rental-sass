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
        "sticky left-0 z-10 flex min-h-[80px] items-center gap-2 border-b border-r border-border p-3 sm:gap-3",
        statusBackgroundClass,
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-9 sm:w-9">
        <div className="relative h-5 w-5 sm:h-6 sm:w-6">
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
        <div className="truncate text-sm font-semibold">
          {vehicle.make} {vehicle.model}
        </div>
        <div className="truncate text-[11px] text-muted-foreground sm:text-xs">
          {vehicle.plate}
        </div>
        <div className="mt-1">
          <StatusBadge status={vehicle.status as "AVAILABLE" | "RENTED" | "MAINTENANCE" | "UNAVAILABLE"} />
        </div>
      </div>
    </div>
  );
}
