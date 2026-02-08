"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startOfWeek, addWeeks, subWeeks, format, parseISO } from "date-fns";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineGrid } from "./TimelineGrid";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import type { CalendarVehicle, CalendarBooking } from "@/lib/actions/calendar";

interface BookingTimelineProps {
  vehicles: CalendarVehicle[];
  bookings: CalendarBooking[];
  weekStart: Date;
  weekEnd: Date;
}

export function BookingTimeline({
  vehicles,
  bookings,
  weekStart: initialWeekStart,
  weekEnd: initialWeekEnd,
}: BookingTimelineProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState("all");

  const weekStart = new Date(initialWeekStart);
  const weekEnd = new Date(initialWeekEnd);

  // Filter bookings by status
  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

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
    const active = bookings.filter((b) => b.status === "ACTIVE").length;
    const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
    const totalRevenue = bookings
      .filter((b) => b.status !== "CANCELED")
      .reduce((sum, b) => sum + b.totalPrice, 0);
    const occupiedVehicles = new Set(
      bookings
        .filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED")
        .map((b) => b.vehicleId)
    ).size;
    const occupationRate =
      vehicles.length > 0
        ? Math.round((occupiedVehicles / vehicles.length) * 100)
        : 0;

    return { active, confirmed, totalRevenue, occupationRate };
  }, [bookings, vehicles]);

  const formattedRevenue = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(stats.totalRevenue);

  // Check if there are any bookings at all
  const hasBookings = bookings.length > 0;

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-3 text-center">
          <div className="text-lg font-bold text-foreground">
            {stats.active + stats.confirmed}
          </div>
          <div className="text-xs text-muted-foreground">Réservations</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-3 text-center">
          <div className="text-lg font-bold text-foreground">
            {stats.occupationRate}%
          </div>
          <div className="text-xs text-muted-foreground">Taux d&apos;occupation</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-3 text-center">
          <div className="text-lg font-bold text-emerald-600">{stats.active}</div>
          <div className="text-xs text-muted-foreground">En location</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-3 text-center">
          <div className="text-lg font-bold text-foreground">
            {formattedRevenue} MAD
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
      <TimelineGrid
        vehicles={vehicles}
        bookings={filteredBookings}
        weekStart={weekStart}
        weekEnd={weekEnd}
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
