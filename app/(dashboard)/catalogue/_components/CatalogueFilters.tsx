"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Filter,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/** Normalize to start of day in local time so calendar highlights match the selected range. */
function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDateFromUrl(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : startOfDayLocal(d);
}

export function CatalogueFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const searchParam = searchParams.get("search");

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

  // Sync state from URL when searchParams change (e.g. back/forward or external update)
  useEffect(() => {
    const start = parseDateFromUrl(startParam) ?? startOfDayLocal(new Date());
    const end = parseDateFromUrl(endParam);
    setStartDate(start);
    setEndDate(end ?? (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return startOfDayLocal(tomorrow);
    })());
  }, [startParam, endParam]);

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
    if (endDate) params.set("end", startOfDayLocal(endDate).toISOString());
    
    router.push(`?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, startDate, endDate, router, searchParams]);

  return (
    <div className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-6 pb-4 pt-2" suppressHydrationWarning>
      <div className="flex flex-col gap-4" suppressHydrationWarning>
        <div className="flex flex-wrap items-center gap-3" suppressHydrationWarning>
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher (modèle, plaque, catégorie...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-[240px]",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="text-sm font-medium">Dates de location</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const today = startOfDayLocal(new Date());
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setStartDate(today);
                      setEndDate(tomorrow);
                    }}
                  >
                    Réinitialiser
                  </Button>
                </div>
                <div className="flex">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={startDate ?? new Date()}
                    selected={{
                      from: startDate ? startOfDayLocal(startDate) : undefined,
                      to: endDate ? startOfDayLocal(endDate) : undefined,
                    }}
                    onSelect={(range) => {
                      setStartDate(range?.from ? startOfDayLocal(range.from) : undefined);
                      setEndDate(range?.to ? startOfDayLocal(range.to) : undefined);
                    }}
                    numberOfMonths={2}
                    locale={fr}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center rounded-xl p-1 bg-muted/40">
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

          <Select defaultValue="availability">
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_asc">Prix: Croissant</SelectItem>
              <SelectItem value="price_desc">Prix: Décroissant</SelectItem>
              <SelectItem value="availability">Disponibilité</SelectItem>
              <SelectItem value="name">Nom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1" suppressHydrationWarning>
          <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent">
            Boîte: Tous <X className="h-3 w-3" />
          </Badge>
          <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent">
            Type: Tous <X className="h-3 w-3" />
          </Badge>
          <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent">
            Places: Toutes <X className="h-3 w-3" />
          </Badge>
          <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent">
            Clim: Tous <X className="h-3 w-3" />
          </Badge>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <Filter className="h-3 w-3" /> Plus de filtres
          </Button>
        </div>
      </div>
    </div>
  );
}
