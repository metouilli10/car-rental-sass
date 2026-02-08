"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimelineHeaderProps {
  weekStart: Date;
  weekEnd: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  statusFilter: string;
  onStatusFilterChange: (filter: string) => void;
}

export function TimelineHeader({
  weekStart,
  weekEnd,
  onPreviousWeek,
  onNextWeek,
  onToday,
  statusFilter,
  onStatusFilterChange,
}: TimelineHeaderProps) {
  const dateRangeLabel = `${format(weekStart, "d", { locale: fr })} - ${format(
    weekEnd,
    "d MMMM yyyy",
    { locale: fr }
  )}`;

  return (
    <div className="space-y-4">
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Calendrier des Réservations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vue chronologique de toutes les réservations par véhicule
          </p>
        </div>
        <Button asChild>
          <Link href="/bookings/create">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Réservation
          </Link>
        </Button>
      </div>

      {/* Navigation Row */}
      <div className="flex items-center justify-between bg-card rounded-lg border border-border p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[220px] text-center capitalize">
            {dateRangeLabel}
          </span>
          <Button variant="outline" size="icon" onClick={onNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToday}>
            Aujourd&apos;hui
          </Button>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">Tous les statuts</option>
            <option value="CONFIRMED">Confirmées</option>
            <option value="ACTIVE">Actives</option>
            <option value="DRAFT">Brouillons</option>
            <option value="COMPLETED">Terminées</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-100 border-l-2 border-blue-500" />
          <span>Confirmé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-100 border-l-2 border-emerald-500" />
          <span>Actif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-100 border-l-2 border-amber-500" />
          <span>Brouillon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-100 border-l-2 border-red-500" />
          <span>En retard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-100 border-l-2 border-gray-400" />
          <span>Terminé</span>
        </div>
      </div>
    </div>
  );
}
