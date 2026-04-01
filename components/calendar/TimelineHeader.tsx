"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalizedPath } from "@/components/i18n/use-localized-path";

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
  const lp = useLocalizedPath();
  const dateRangeLabel = `${format(weekStart, "d", { locale: fr })} - ${format(
    weekEnd,
    "d MMMM yyyy",
    { locale: fr }
  )}`;

  return (
    <div className="space-y-4">
      {/* Title Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-start gap-2 text-2xl font-bold tracking-tight sm:items-center">
            <CalendarDays className="mt-1 h-5 w-5 shrink-0 text-primary sm:mt-0 sm:h-6 sm:w-6" />
            Calendrier des Réservations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vue chronologique de toutes les réservations par véhicule
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={lp("/bookings/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Réservation
          </Link>
        </Button>
      </div>

      {/* Navigation Row */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
        <div className="grid w-full grid-cols-[auto,1fr,auto] items-center gap-2 sm:flex sm:w-auto sm:justify-start">
          <Button variant="outline" size="icon" onClick={onPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-0 px-2 text-center text-sm font-medium capitalize sm:min-w-[220px]">
            {dateRangeLabel}
          </span>
          <Button variant="outline" size="icon" onClick={onNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline" size="sm" onClick={onToday} className="w-full sm:w-auto">
            Aujourd&apos;hui
          </Button>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:w-[200px]"
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
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
