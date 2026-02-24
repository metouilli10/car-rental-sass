"use client";

import { useEffect, useMemo, useState } from "react";
import { BookingPaymentStatus, BookingStatus, UserRole } from "@prisma/client";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type DateLike,
  toDate,
  startOfDay,
  endOfDay,
  isSameDay,
  isInRangeInclusive,
  intersectsRange,
} from "@/lib/bookings/list-utils";
import { ReservationCardList } from "@/components/reservations/ReservationCardList";
import { ReservationsTable } from "@/components/reservations/ReservationsTable";

type DatePreset = "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";
type StatusFilter =
  | "ALL"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELED"
  | "OVERDUE";
type QuickFilter = "none" | "active" | "startToday" | "endToday" | "overdue";

export interface BookingListItem {
  id: string;
  startDate: DateLike;
  endDate: DateLike;
  totalPrice: number;
  depositAmount: number;
  status: BookingStatus;
  paymentStatus?: BookingPaymentStatus;
  paidNow?: number | null;
  remainingAmount?: number | null;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    plate: string;
  };
  deposit: {
    status: "HELD" | "PARTIAL_RETURNED" | "RETURNED" | "FORFEITED";
  } | null;
}

interface BookingsControlCenterProps {
  bookings: BookingListItem[];
  role: UserRole;
}

export function BookingsControlCenter({ bookings, role }: BookingsControlCenterProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [datePreset, setDatePreset] = useState<DatePreset>("ALL");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("none");
  const [vehicleFilter, setVehicleFilter] = useState<string>("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim().toLowerCase());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const vehicleOptions = useMemo(() => {
    const byId = new Map<string, { id: string; label: string }>();
    for (const booking of bookings) {
      const label = `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.plate})`;
      if (!byId.has(booking.vehicle.id)) {
        byId.set(booking.vehicle.id, { id: booking.vehicle.id, label });
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [bookings]);

  const stats = useMemo(() => {
    const totals = {
      active: 0,
      departuresToday: 0,
      returnsToday: 0,
      overdue: 0,
    };

    for (const booking of bookings) {
      const startDate = toDate(booking.startDate);
      const endDate = toDate(booking.endDate);

      if (booking.status === "ACTIVE") {
        totals.active += 1;
      }
      if (isSameDay(startDate, today)) {
        totals.departuresToday += 1;
      }
      if (isSameDay(endDate, today)) {
        totals.returnsToday += 1;
      }
      if (booking.status === "ACTIVE" && startOfDay(endDate).getTime() < today.getTime()) {
        totals.overdue += 1;
      }
    }

    return totals;
  }, [bookings, today]);

  const filteredBookings = useMemo(() => {
    const todayStart = today;
    const dayOfWeek = todayStart.getDay();
    const offsetToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = startOfDay(
      new Date(
        todayStart.getFullYear(),
        todayStart.getMonth(),
        todayStart.getDate() - offsetToMonday
      )
    );
    const weekEnd = endOfDay(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6));
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const monthEnd = endOfDay(new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0));

    const customStart = customStartDate ? startOfDay(new Date(customStartDate)) : null;
    const customEnd = customEndDate ? endOfDay(new Date(customEndDate)) : null;

    return bookings.filter((booking) => {
      const startDate = toDate(booking.startDate);
      const endDate = toDate(booking.endDate);
      const normalized = `${booking.customer.name} ${booking.customer.phone} ${booking.vehicle.make} ${booking.vehicle.model} ${booking.vehicle.plate}`.toLowerCase();
      const isOverdue = booking.status === "ACTIVE" && startOfDay(endDate).getTime() < todayStart.getTime();

      if (searchQuery && !normalized.includes(searchQuery)) {
        return false;
      }

      if (vehicleFilter !== "ALL" && booking.vehicle.id !== vehicleFilter) {
        return false;
      }

      if (statusFilter !== "ALL") {
        if (statusFilter === "OVERDUE" && !isOverdue) {
          return false;
        }
        if (
          statusFilter !== "OVERDUE" &&
          booking.status !== statusFilter
        ) {
          return false;
        }
      }

      if (quickFilter !== "none") {
        if (quickFilter === "active" && booking.status !== "ACTIVE") {
          return false;
        }
        if (quickFilter === "startToday" && !isSameDay(startDate, todayStart)) {
          return false;
        }
        if (quickFilter === "endToday" && !isSameDay(endDate, todayStart)) {
          return false;
        }
        if (quickFilter === "overdue" && !isOverdue) {
          return false;
        }
      }

      if (datePreset === "TODAY") {
        if (!intersectsRange(todayStart, endOfDay(todayStart), startOfDay(startDate), endOfDay(endDate))) {
          return false;
        }
      }

      if (datePreset === "THIS_WEEK") {
        if (!intersectsRange(weekStart, weekEnd, startOfDay(startDate), endOfDay(endDate))) {
          return false;
        }
      }

      if (datePreset === "THIS_MONTH") {
        if (!intersectsRange(monthStart, monthEnd, startOfDay(startDate), endOfDay(endDate))) {
          return false;
        }
      }

      if (datePreset === "CUSTOM" && customStart && customEnd) {
        if (!intersectsRange(customStart, customEnd, startOfDay(startDate), endOfDay(endDate))) {
          return false;
        }
      }

      return true;
    });
  }, [
    bookings,
    customEndDate,
    customStartDate,
    datePreset,
    quickFilter,
    searchQuery,
    statusFilter,
    today,
    vehicleFilter,
  ]);

  const hasFiltersApplied =
    searchQuery.length > 0 ||
    statusFilter !== "ALL" ||
    datePreset !== "ALL" ||
    quickFilter !== "none" ||
    vehicleFilter !== "ALL" ||
    customStartDate.length > 0 ||
    customEndDate.length > 0;

  const resetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("ALL");
    setDatePreset("ALL");
    setQuickFilter("none");
    setVehicleFilter("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            setQuickFilter("active");
            setStatusFilter("ACTIVE");
          }}
          className="rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-primary/30 hover:shadow-md"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Actives
          </p>
          <p className="mt-1 text-2xl font-semibold">{stats.active}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setQuickFilter("startToday");
            setDatePreset("TODAY");
          }}
          className="rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-primary/30 hover:shadow-md"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Départs aujourd&apos;hui
          </p>
          <p className="mt-1 text-2xl font-semibold">{stats.departuresToday}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setQuickFilter("endToday");
            setDatePreset("TODAY");
          }}
          className="rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-primary/30 hover:shadow-md"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Retours aujourd&apos;hui
          </p>
          <p className="mt-1 text-2xl font-semibold">{stats.returnsToday}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setQuickFilter("overdue");
            setStatusFilter("OVERDUE");
          }}
          className="rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-red-300 hover:shadow-md"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            En retard
          </p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{stats.overdue}</p>
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-card space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Rechercher client, téléphone, véhicule, plaque…"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {([
              { value: "ALL", label: "Tous" },
              { value: "CONFIRMED", label: "Confirmées" },
              { value: "ACTIVE", label: "En cours" },
              { value: "COMPLETED", label: "Terminées" },
              { value: "CANCELED", label: "Annulées" },
              { value: "OVERDUE", label: "En retard" },
            ] as const).map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={statusFilter === item.value ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(item.value);
                  setQuickFilter("none");
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="w-full xl:w-56">
            <Select
              value={datePreset}
              onValueChange={(value) => {
                setDatePreset(value as DatePreset);
                setQuickFilter("none");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes dates</SelectItem>
                <SelectItem value="TODAY">Aujourd&apos;hui</SelectItem>
                <SelectItem value="THIS_WEEK">Cette semaine</SelectItem>
                <SelectItem value="THIS_MONTH">Ce mois</SelectItem>
                <SelectItem value="CUSTOM">Personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {datePreset === "CUSTOM" ? (
            <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
              <Input
                type="date"
                value={customStartDate}
                onChange={(event) => setCustomStartDate(event.target.value)}
                className="sm:w-44"
              />
              <Input
                type="date"
                value={customEndDate}
                onChange={(event) => setCustomEndDate(event.target.value)}
                className="sm:w-44"
              />
            </div>
          ) : null}

          {vehicleOptions.length > 0 ? (
            <div className="w-full xl:w-72">
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par véhicule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les véhicules</SelectItem>
                  {vehicleOptions.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {hasFiltersApplied ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              <X className="mr-1 h-4 w-4" />
              Réinitialiser filtres
            </Button>
          ) : null}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="rounded-2xl border bg-white px-6 py-14 text-center shadow-card">
          <p className="text-lg font-semibold">Aucun résultat</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajustez vos filtres ou revenez à la vue complète.
          </p>
          <Button className="mt-4" variant="outline" onClick={resetFilters}>
            Réinitialiser filtres
          </Button>
        </div>
      ) : (
        <>
          <div className="md:hidden">
            <ReservationCardList
              bookings={filteredBookings}
              role={role}
              today={today}
            />
          </div>
          <div className="hidden md:block">
            <ReservationsTable
              bookings={filteredBookings}
              role={role}
              today={today}
            />
          </div>
        </>
      )}
    </div>
  );
}
