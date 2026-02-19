"use client";

import { useMemo } from "react";
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isToday,
  max,
  min,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CalendarBooking, CalendarVehicle } from "@/lib/actions/calendar";
import { VehicleRow } from "./VehicleRow";
import { ReservationBlock } from "./ReservationBlock";
import { useCalendarInteractions } from "./useCalendarInteractions";

interface CalendarGridProps {
  vehicles: CalendarVehicle[];
  bookings: CalendarBooking[];
  weekStart: Date;
  weekEnd: Date;
  currentUserRole: "OWNER" | "MANAGER" | "EMPLOYEE";
  setBookings: React.Dispatch<React.SetStateAction<CalendarBooking[]>>;
  onCommitDates: (payload: {
    bookingId: string;
    startDate: Date;
    endDate: Date;
    updatedAt?: Date;
  }) => Promise<{
    id: string;
    startDate: string;
    endDate: string;
    updatedAt?: string;
  }>;
  onCreateFromRange: (payload: {
    vehicleId: string;
    startDate: Date;
    endDate: Date;
  }) => void;
  onError: (message: string) => void;
}

export function CalendarGrid({
  vehicles,
  bookings,
  weekStart,
  weekEnd,
  currentUserRole,
  setBookings,
  onCommitDates,
  onCreateFromRange,
  onError,
}: CalendarGridProps) {
  const canEdit = currentUserRole === "OWNER" || currentUserRole === "MANAGER" || currentUserRole === "EMPLOYEE";
  const canManageDestructive = currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd],
  );

  const bookingsByVehicle = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const booking of bookings) {
      const existing = map.get(booking.vehicleId) ?? [];
      existing.push(booking);
      map.set(booking.vehicleId, existing);
    }
    return map;
  }, [bookings]);

  const {
    interaction,
    savingIds,
    scrollContainerRef,
    registerRowRef,
    onDragPointerDown,
    onResizePointerDown,
    onCreatePointerDown,
  } = useCalendarInteractions({
    weekStart,
    bookings,
    canEdit,
    setBookings,
    onCommitDates,
    onCreateFromRange,
    onError,
  });

  const weekEndExclusive = useMemo(() => addDays(weekEnd, 1), [weekEnd]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid border-b border-border" style={{ gridTemplateColumns: "200px repeat(7, 1fr)" }}>
            <div className="border-r border-border bg-muted/50 p-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Véhicules
              </span>
            </div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-r border-border p-3 text-center last:border-r-0",
                  isToday(day) ? "bg-primary/10 font-semibold" : "bg-muted/30",
                )}
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {format(day, "EEE", { locale: fr })}
                </div>
                <div
                  className={cn(
                    "mt-0.5 text-sm",
                    isToday(day) ? "font-bold text-primary" : "font-medium text-foreground",
                  )}
                >
                  {format(day, "d", { locale: fr })}
                </div>
              </div>
            ))}
          </div>

          {vehicles.map((vehicle) => {
            const vehicleBookings = bookingsByVehicle.get(vehicle.id) ?? [];

            return (
              <div
                key={vehicle.id}
                className="grid border-b border-border last:border-b-0"
                style={{ gridTemplateColumns: "200px repeat(7, 1fr)", minHeight: "86px" }}
              >
                <VehicleRow vehicle={vehicle} />

                <div
                  ref={registerRowRef(vehicle.id)}
                  className="relative grid grid-cols-7"
                  style={{ gridColumn: "2 / 9" }}
                >
                  {days.map((day, dayIndex) => (
                    <div
                      key={`${vehicle.id}-${day.toISOString()}`}
                      className={cn(
                        "min-h-[86px] border-r border-border last:border-r-0 transition-colors",
                        isToday(day) && "bg-primary/[0.06]",
                        canEdit && "cursor-crosshair hover:bg-muted/30",
                      )}
                      onPointerDown={(event) =>
                        onCreatePointerDown(event, vehicle.id, dayIndex)
                      }
                    />
                  ))}

                  {vehicleBookings.map((booking) => {
                    const bookingStart = new Date(booking.startDate);
                    const bookingEnd = new Date(booking.endDate);

                    const visibleStart = max([bookingStart, weekStart]);
                    const visibleEnd = min([bookingEnd, weekEndExclusive]);

                    const startDay = Math.max(
                      0,
                      Math.min(6, differenceInCalendarDays(visibleStart, weekStart)),
                    );
                    const endDay = Math.max(
                      0,
                      Math.min(7, differenceInCalendarDays(visibleEnd, weekStart)),
                    );
                    const span = endDay - startDay;
                    if (span <= 0) return null;

                    const isInteractingThisBooking =
                      (interaction.type === "drag" || interaction.type === "resize") &&
                      interaction.reservationId === booking.id;

                    return (
                      <div
                        key={booking.id}
                        className="absolute inset-y-0 z-20"
                        style={{
                          left: `${(startDay / 7) * 100}%`,
                          width: `${(span / 7) * 100}%`,
                        }}
                      >
                        <ReservationBlock
                          booking={booking}
                          vehicle={vehicle}
                          canEdit={canEdit}
                          canManageDestructive={canManageDestructive}
                          isSaving={Boolean(savingIds[booking.id])}
                          highlight={
                            isInteractingThisBooking
                              ? interaction.valid
                                ? "valid"
                                : "invalid"
                              : undefined
                          }
                          onDragPointerDown={(event) =>
                            onDragPointerDown(event, booking, vehicle.id)
                          }
                          onResizePointerDown={(event, edge) =>
                            onResizePointerDown(event, booking, vehicle.id, edge)
                          }
                        />
                      </div>
                    );
                  })}

                  {interaction.type === "create" && interaction.vehicleId === vehicle.id ? (
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-y-1 z-30 rounded-md border-2",
                        interaction.valid
                          ? "border-emerald-500/80 bg-emerald-400/15"
                          : "border-red-500/90 bg-red-400/15",
                      )}
                      style={{
                        left: `${(Math.min(interaction.startDay, interaction.endDay) / 7) * 100}%`,
                        width: `${((Math.abs(interaction.endDay - interaction.startDay) + 1) / 7) * 100}%`,
                      }}
                    >
                      {!interaction.valid && interaction.reason ? (
                        <div className="absolute -top-5 left-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {interaction.reason}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {(interaction.type === "drag" || interaction.type === "resize") &&
                  interaction.initial.vehicleId === vehicle.id &&
                  !interaction.valid &&
                  interaction.reason ? (
                    <div className="pointer-events-none absolute left-2 top-1 z-40 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {interaction.reason}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {vehicles.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Aucun véhicule enregistré. Ajoutez des véhicules pour voir le calendrier.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
