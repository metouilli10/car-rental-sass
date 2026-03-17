"use client";

import { useState, useMemo, useCallback, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startOfWeek, addWeeks, subWeeks, format } from "date-fns";
import { TimelineHeader } from "./TimelineHeader";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import type { CalendarVehicle, CalendarBooking } from "@/lib/actions/calendar";
import { toDayKeyLocal } from "./conflict";

interface BookingTimelineProps {
  vehicles: CalendarVehicle[];
  bookings: CalendarBooking[];
  weekStart: Date;
  weekEnd: Date;
  currentUserRole: "OWNER" | "MANAGER" | "EMPLOYEE";
}

export function BookingTimeline({
  vehicles,
  bookings,
  weekStart: initialWeekStart,
  weekEnd: initialWeekEnd,
  currentUserRole,
}: BookingTimelineProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState("all");
  const [calendarBookings, setCalendarBookings] = useState<CalendarBooking[]>(bookings);

  const weekStart = useMemo(() => new Date(initialWeekStart), [initialWeekStart]);
  const weekEnd = useMemo(() => new Date(initialWeekEnd), [initialWeekEnd]);

  useEffect(() => {
    setCalendarBookings(bookings);
  }, [bookings]);

  // Filter bookings by status
  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return calendarBookings;
    return calendarBookings.filter((b) => b.status === statusFilter);
  }, [calendarBookings, statusFilter]);

  const navigateToWeek = useCallback(
    (date: Date) => {
      const monday = startOfWeek(date, { weekStartsOn: 1 });
      const weekParam = format(monday, "yyyy-MM-dd");
      startTransition(() => {
        router.push(`/calendrier?week=${weekParam}`);
      });
    },
    [router]
  );

  const handlePreviousWeek = useCallback(() => {
    navigateToWeek(subWeeks(weekStart, 1));
  }, [weekStart, navigateToWeek]);

  const handleNextWeek = useCallback(() => {
    navigateToWeek(addWeeks(weekStart, 1));
  }, [weekStart, navigateToWeek]);

  const handleToday = useCallback(() => {
    navigateToWeek(new Date());
  }, [navigateToWeek]);

  // Quick stats
  const stats = useMemo(() => {
    const active = calendarBookings.filter((b) => b.status === "ACTIVE").length;
    const confirmed = calendarBookings.filter((b) => b.status === "CONFIRMED").length;
    const totalRevenue = calendarBookings
      .filter((b) => b.status !== "CANCELED")
      .reduce((sum, b) => sum + b.totalPrice, 0);
    const occupiedVehicles = new Set(
      calendarBookings
        .filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED")
        .map((b) => b.vehicleId)
    ).size;
    const occupationRate =
      vehicles.length > 0
        ? Math.round((occupiedVehicles / vehicles.length) * 100)
        : 0;

    return { active, confirmed, totalRevenue, occupationRate };
  }, [calendarBookings, vehicles]);

  const formattedRevenue = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(stats.totalRevenue);

  // Check if there are any bookings at all
  const hasBookings = calendarBookings.length > 0;

  const handleCommitDates = useCallback(
    async (payload: {
      bookingId: string;
      startDate: Date;
      endDate: Date;
      updatedAt?: Date;
    }) => {
      const response = await fetch(`/api/bookings/${payload.bookingId}/dates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: payload.startDate.toISOString(),
          endDate: payload.endDate.toISOString(),
          updatedAt: payload.updatedAt?.toISOString(),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        booking?: { id: string; startDate: string; endDate: string; updatedAt?: string };
        error?: string;
      };

      if (!response.ok || !data.booking) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      return data.booking;
    },
    [],
  );

  const handleCreateFromRange = useCallback(
    (payload: { vehicleId: string; startDate: Date; endDate: Date }) => {
      const params = new URLSearchParams({
        vehicleId: payload.vehicleId,
        start: toDayKeyLocal(payload.startDate),
        end: toDayKeyLocal(payload.endDate),
      });
      router.push(`/bookings/create?${params.toString()}`);
    },
    [router],
  );

  const handleInteractionError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <TimelineHeader
        weekStart={weekStart}
        weekEnd={weekEnd}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="bg-card rounded-lg border border-border p-3 text-center sm:p-4">
          <div className="text-lg font-bold text-foreground">
            {stats.active + stats.confirmed}
          </div>
          <div className="text-xs text-muted-foreground">Réservations</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-3 text-center sm:p-4">
          <div className="text-lg font-bold text-foreground">
            {stats.occupationRate}%
          </div>
          <div className="text-xs text-muted-foreground">Taux d&apos;occupation</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-3 text-center sm:p-4">
          <div className="text-lg font-bold text-emerald-600">{stats.active}</div>
          <div className="text-xs text-muted-foreground">En location</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-3 text-center sm:p-4">
          <div className="text-lg font-bold text-foreground sm:text-xl">
            <span className="block leading-none">{formattedRevenue}</span>
            <span className="mt-1 block text-base sm:text-lg">MAD</span>
          </div>
          <div className="text-xs text-muted-foreground">Revenu semaine</div>
        </div>
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="relative">
          <div className="absolute inset-0 bg-background/60 z-30 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Chargement...</span>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Grid */}
      <CalendarGrid
        vehicles={vehicles}
        bookings={filteredBookings}
        weekStart={weekStart}
        weekEnd={weekEnd}
        currentUserRole={currentUserRole}
        setBookings={setCalendarBookings}
        onCommitDates={handleCommitDates}
        onCreateFromRange={handleCreateFromRange}
        onError={handleInteractionError}
      />

      {/* Empty state when there are vehicles but no bookings */}
      {vehicles.length > 0 && !hasBookings && (
        <div className="text-center py-8 bg-card rounded-lg border border-border">
          <CalendarDays className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Aucune réservation cette semaine
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Il n&apos;y a aucune réservation pour la période sélectionnée.
          </p>
          <Button asChild>
            <Link href="/bookings/create">
              <Plus className="h-4 w-4 mr-2" />
              Créer une réservation
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
