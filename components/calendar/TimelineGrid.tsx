"use client";

import { useMemo } from "react";
import {
  format,
  eachDayOfInterval,
  isToday,
  isSameDay,
  differenceInCalendarDays,
  max,
  min,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { VehicleRow } from "./VehicleRow";
import { EventTooltip } from "./EventTooltip";
import type { CalendarVehicle, CalendarBooking } from "@/lib/actions/calendar";

interface TimelineGridProps {
  vehicles: CalendarVehicle[];
  bookings: CalendarBooking[];
  weekStart: Date;
  weekEnd: Date;
}

export function TimelineGrid({
  vehicles,
  bookings,
  weekStart,
  weekEnd,
}: TimelineGridProps) {
  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  // Group bookings by vehicleId
  const bookingsByVehicle = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const booking of bookings) {
      const existing = map.get(booking.vehicleId) || [];
      existing.push(booking);
      map.set(booking.vehicleId, existing);
    }
    return map;
  }, [bookings]);

  // Calculate column position for a booking within the week grid
  // Column 1 = sidebar (vehicle info), columns 2-8 = Mon-Sun
  function getBookingColumns(booking: CalendarBooking) {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);

    // Clamp to visible week
    const visibleStart = max([bookingStart, weekStart]);
    const visibleEnd = min([bookingEnd, weekEnd]);

    // Column index: day 0 (Mon) -> grid column 2, day 6 (Sun) -> grid column 8
    const startCol = differenceInCalendarDays(visibleStart, weekStart) + 2;
    const endCol = differenceInCalendarDays(visibleEnd, weekStart) + 3; // +3 because grid-column-end is exclusive

    return {
      columnStart: Math.max(2, startCol),
      columnEnd: Math.min(9, endCol),
    };
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Scrollable container */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header row: empty sidebar + day columns */}
          <div
            className="grid border-b border-border"
            style={{
              gridTemplateColumns: "200px repeat(7, 1fr)",
            }}
          >
            {/* Empty corner cell */}
            <div className="p-3 border-r border-border bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Véhicules
              </span>
            </div>

            {/* Day headers */}
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-3 text-center border-r border-border last:border-r-0",
                  isToday(day)
                    ? "bg-primary/5 font-semibold"
                    : "bg-muted/30"
                )}
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {format(day, "EEE", { locale: fr })}
                </div>
                <div
                  className={cn(
                    "text-sm mt-0.5",
                    isToday(day)
                      ? "text-primary font-bold"
                      : "text-foreground font-medium"
                  )}
                >
                  {format(day, "d", { locale: fr })}
                </div>
                {isToday(day) && (
                  <div className="text-[9px] text-primary font-medium mt-0.5">
                    Aujourd&apos;hui
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Vehicle rows with bookings */}
          {vehicles.map((vehicle) => {
            const vehicleBookings = bookingsByVehicle.get(vehicle.id) || [];

            return (
              <div
                key={vehicle.id}
                className="grid border-b border-border last:border-b-0 group"
                style={{
                  gridTemplateColumns: "200px repeat(7, 1fr)",
                  minHeight: "80px",
                }}
              >
                {/* Vehicle sidebar */}
                <VehicleRow vehicle={vehicle} />

                {/* Day cells + booking blocks */}
                {days.map((day, dayIndex) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "relative border-r border-border last:border-r-0 min-h-[80px]",
                      isToday(day) && "bg-primary/[0.03]",
                      "group-hover:bg-muted/20 transition-colors"
                    )}
                  >
                    {/* Render booking blocks that START on this day within this vehicle */}
                    {vehicleBookings
                      .filter((booking) => {
                        const bookingStart = new Date(booking.startDate);
                        const visibleStart = max([bookingStart, weekStart]);
                        // Only render once: on the first visible day of the booking
                        return isSameDay(visibleStart, day);
                      })
                      .map((booking) => {
                        const { columnStart, columnEnd } =
                          getBookingColumns(booking);
                        // Calculate span in days for width
                        const spanDays = columnEnd - columnStart;

                        return (
                          <div
                            key={booking.id}
                            className="absolute inset-y-0 z-10"
                            style={{
                              left: 0,
                              // Width spans across multiple cells
                              width: `${spanDays * 100}%`,
                            }}
                          >
                            <EventTooltip
                              booking={booking}
                              vehicle={vehicle}
                              columnStart={columnStart}
                              columnEnd={columnEnd}
                            />
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Empty state if no vehicles */}
          {vehicles.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">
                Aucun véhicule enregistré. Ajoutez des véhicules pour voir le
                calendrier.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
