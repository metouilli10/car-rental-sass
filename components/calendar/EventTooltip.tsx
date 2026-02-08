"use client";

import { useRouter } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { User, Phone, Car, CalendarDays, Banknote, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarBooking, CalendarVehicle } from "@/lib/actions/calendar";
import { getEffectiveStatus, statusStyles } from "./EventBlock";
import { isBefore, startOfDay } from "date-fns";

interface EventTooltipProps {
  booking: CalendarBooking;
  vehicle?: CalendarVehicle;
  columnStart: number;
  columnEnd: number;
}

export function EventTooltip({
  booking,
  vehicle,
  columnStart,
  columnEnd,
}: EventTooltipProps) {
  const router = useRouter();
  const effectiveStatus = getEffectiveStatus(booking);
  const style = statusStyles[effectiveStatus] || statusStyles.CONFIRMED;

  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const duration = differenceInDays(endDate, startDate);

  const formattedPrice = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(booking.totalPrice);

  const formattedPricePerDay = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(booking.pricePerDay);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "absolute top-1 bottom-1 rounded-md border-l-4 px-2 py-1.5 cursor-pointer transition-all",
            "hover:shadow-md hover:scale-[1.02] hover:z-20",
            "overflow-hidden text-left w-full",
            style.bg,
            style.border,
            style.text
          )}
          title={`${booking.customer.name} - ${formattedPrice} MAD`}
        >
          <div className="font-semibold text-xs truncate leading-tight">
            {booking.customer.name}
          </div>
          <div className="text-[10px] opacity-75 truncate leading-tight mt-0.5">
            {booking.customer.phone}
          </div>
          <div className="text-[10px] font-medium truncate leading-tight mt-0.5">
            {formattedPrice} MAD
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={8}>
        <div className="p-4 space-y-3">
          {/* Customer */}
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-sm">{booking.customer.name}</div>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground">{booking.customer.phone}</span>
          </div>

          {/* Vehicle */}
          {vehicle && (
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">
                {vehicle.make} {vehicle.model}
              </span>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm">
              {format(startDate, "d MMM", { locale: fr })} -{" "}
              {format(endDate, "d MMM yyyy", { locale: fr })}
              <span className="text-muted-foreground ml-1">
                ({duration} jour{duration > 1 ? "s" : ""})
              </span>
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium">
              {formattedPrice} MAD
              <span className="text-muted-foreground font-normal ml-1">
                ({formattedPricePerDay}/jour)
              </span>
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <StatusBadge
              status={
                effectiveStatus === "LATE"
                  ? "ACTIVE"
                  : (booking.status as "DRAFT" | "CONFIRMED" | "ACTIVE" | "COMPLETED")
              }
            />
            {effectiveStatus === "LATE" && (
              <span className="text-xs text-red-600 font-medium">En retard</span>
            )}
          </div>

          {/* Action */}
          <div className="pt-1 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-primary hover:text-primary"
              onClick={() => router.push(`/bookings/${booking.id}`)}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              Voir détails
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
