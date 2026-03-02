"use client";

import { Badge } from "@/components/ui/badge";
import type { BookingRiskSignal } from "@/lib/bookings/risk";

interface ReservationRiskBadgesProps {
  signals: BookingRiskSignal[];
  emptyLabel?: string;
  compact?: boolean;
}

function getBadgeVariant(signal: BookingRiskSignal) {
  if (signal.kind === "overlap") {
    return "destructive" as const;
  }
  if (signal.kind === "deposit") {
    return "warning" as const;
  }
  if (signal.kind === "late" && signal.tone === "destructive") {
    return "destructive" as const;
  }
  if (signal.kind === "late" && signal.tone === "warning") {
    return "warning" as const;
  }
  return "info" as const;
}

export function ReservationRiskBadges({
  signals,
  emptyLabel = "Aucun risque immediat",
  compact = false,
}: ReservationRiskBadgesProps) {
  if (signals.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className={compact ? "flex flex-wrap gap-1.5" : "flex flex-col gap-1.5"}>
      {signals.map((signal) => (
        <Badge
          key={`${signal.kind}-${signal.label}`}
          variant={getBadgeVariant(signal)}
          className={compact ? "text-xs" : "w-fit text-xs"}
        >
          {signal.label}
        </Badge>
      ))}
    </div>
  );
}
