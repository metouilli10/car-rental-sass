"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Gearbox } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Search, 
  LayoutGrid, 
  List,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Normalize to start of day in local time so calendar highlights match the selected range. */
function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDateFromUrl(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : startOfDayLocal(d);
}

interface CatalogueFiltersProps {
  categories: string[];
}

export function CatalogueFilters({ categories }: CatalogueFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const searchParam = searchParams.get("search");
  const categoryParam = searchParams.get("category") || "";
  const gearboxParam = searchParams.get("gearbox") || "";
  const availabilityParam = searchParams.get("availability") || "";
  const sortParam = searchParams.get("sort") || "availability";

  const initialStart = useMemo(
    () => parseDateFromUrl(startParam) ?? startOfDayLocal(new Date()),
    [startParam]
  );
  const initialEnd = useMemo(() => {
    const end = parseDateFromUrl(endParam);
    if (end) return end;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return startOfDayLocal(tomorrow);
  }, [endParam]);
  
  const [search, setSearch] = useState(searchParam || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [startDate, setStartDate] = useState<Date | undefined>(initialStart);
  const [endDate, setEndDate] = useState<Date | undefined>(initialEnd);
  const [view, setView] = useState<"grid" | "list">("grid");

  const resetDateRange = () => {
    const today = startOfDayLocal(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(today);
    setEndDate(tomorrow);
  };

  const handleStartDateSelect = (day: Date | undefined) => {
    if (!day) return;

    const nextStart = startOfDayLocal(day);
    setStartDate(nextStart);

    if (!endDate || nextStart.getTime() > startOfDayLocal(endDate).getTime()) {
      setEndDate(nextStart);
    }
  };

  const handleEndDateSelect = (day: Date | undefined) => {
    if (!day) return;

    const nextEnd = startOfDayLocal(day);

    if (!startDate) {
      setStartDate(nextEnd);
      setEndDate(nextEnd);
      return;
    }

    if (nextEnd.getTime() < startOfDayLocal(startDate).getTime()) {
      setEndDate(startOfDayLocal(startDate));
      return;
    }

    setEndDate(nextEnd);
  };

  const updateQueryParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete("page");

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) return;

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  // Sync state from URL when searchParams change (e.g. back/forward or external update)
  useEffect(() => {
    const start = parseDateFromUrl(startParam) ?? startOfDayLocal(new Date());
    const end = parseDateFromUrl(endParam);
    setSearch(searchParam || "");
    setDebouncedSearch(searchParam || "");
    setStartDate(start);
    setEndDate(end ?? (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return startOfDayLocal(tomorrow);
    })());
  }, [endParam, searchParam, startParam]);

  // Debounce search input -- 300ms delay before triggering URL update
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Update URL when debounced search or date filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (debouncedSearch) params.set("search", debouncedSearch);
    else params.delete("search");

    if (startDate) params.set("start", startOfDayLocal(startDate).toISOString());
    else params.delete("start");

    if (endDate) params.set("end", startOfDayLocal(endDate).toISOString());
    else params.delete("end");
    params.delete("page");

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) return;

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [debouncedSearch, endDate, pathname, router, searchParams, startDate]);

  return (
    <div className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-6 pb-4 pt-2" suppressHydrationWarning>
      <div className="flex flex-col gap-4" suppressHydrationWarning>
        <div className="relative w-full" suppressHydrationWarning>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher (modèle, plaque, catégorie...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3" suppressHydrationWarning>
          <div className="min-w-0 flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {startDate ? (
                      endDate ? (
                        <>
                          {format(startDate, "dd MMM", { locale: fr })} -{" "}
                          {format(endDate, "dd MMM", { locale: fr })}
                        </>
                      ) : (
                        format(startDate, "dd MMM", { locale: fr })
                      )
                    ) : (
                      <span>Sélectionnez des dates</span>
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="text-sm font-medium">Dates de location</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetDateRange}
                  >
                    Réinitialiser
                  </Button>
                </div>
                <div className="grid gap-4 p-3 md:grid-cols-2">
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="mb-3">
                      <p className="text-sm font-medium">Début</p>
                      <p className="text-xs text-muted-foreground">
                        {startDate
                          ? format(startDate, "PPP", { locale: fr })
                          : "Choisir la date de départ"}
                      </p>
                    </div>
                    <Calendar
                      initialFocus
                      mode="single"
                      month={startDate ?? new Date()}
                      selected={startDate ? startOfDayLocal(startDate) : undefined}
                      onSelect={handleStartDateSelect}
                      locale={fr}
                    />
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="mb-3">
                      <p className="text-sm font-medium">Fin</p>
                      <p className="text-xs text-muted-foreground">
                        {endDate
                          ? format(endDate, "PPP", { locale: fr })
                          : "Choisir la date de retour"}
                      </p>
                    </div>
                    <Calendar
                      mode="single"
                      month={endDate ?? startDate ?? new Date()}
                      selected={endDate ? startOfDayLocal(endDate) : undefined}
                      onSelect={handleEndDateSelect}
                      disabled={startDate ? { before: startOfDayLocal(startDate) } : undefined}
                      locale={fr}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex shrink-0 items-center rounded-xl bg-muted/40 p-1">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("grid")}
              className="h-8 w-8 p-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2" suppressHydrationWarning>
          <Select
            value={sortParam}
            onValueChange={(value) => updateQueryParams({ sort: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="availability">Tri: disponibilité</SelectItem>
              <SelectItem value="price_asc">Tri: prix croissant</SelectItem>
              <SelectItem value="price_desc">Tri: prix décroissant</SelectItem>
              <SelectItem value="name">Tri: nom</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={availabilityParam || "all"}
            onValueChange={(value) =>
              updateQueryParams({ availability: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Disponibilité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Disponibilité: Toutes</SelectItem>
              <SelectItem value="AVAILABLE">Disponible</SelectItem>
              <SelectItem value="RETURNING_TODAY">Retour aujourd&apos;hui</SelectItem>
              <SelectItem value="UNAVAILABLE">Indisponible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2" suppressHydrationWarning>
          <Select
            value={gearboxParam || "all"}
            onValueChange={(value) =>
              updateQueryParams({ gearbox: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Boîte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Boîte: Toutes</SelectItem>
              <SelectItem value={Gearbox.MANUAL}>Manuelle</SelectItem>
              <SelectItem value={Gearbox.AUTO}>Automatique</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryParam || "all"}
            onValueChange={(value) =>
              updateQueryParams({ category: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Type: Tous</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-start" suppressHydrationWarning>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1 px-0 text-xs sm:px-3"
            onClick={() =>
              updateQueryParams({
                category: undefined,
                gearbox: undefined,
                availability: undefined,
                sort: "availability",
              })
            }
          >
            <Filter className="h-3 w-3" /> Réinitialiser filtres
          </Button>
        </div>
      </div>
    </div>
  );
}
