"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type NotificationStatusFilter = "ALL" | "OPEN" | "SNOOZED" | "DONE" | "DISMISSED";
type NotificationSeverityFilter = "ALL" | "INFO" | "WARNING" | "DUE";
type NotificationTypeFilter =
  | "ALL"
  | "OIL_CHANGE"
  | "INSURANCE_EXPIRY"
  | "TECH_INSPECTION"
  | "VIGNETTE";

interface NotificationFiltersClientProps {
  activeStatus: NotificationStatusFilter;
  search: string;
  severity: NotificationSeverityFilter;
  type: NotificationTypeFilter;
  counts: Record<NotificationStatusFilter, number>;
}

const statusItems: Array<{ value: NotificationStatusFilter; label: string }> = [
  { value: "ALL", label: "Tous" },
  { value: "OPEN", label: "À faire" },
  { value: "SNOOZED", label: "Snoozées" },
  { value: "DONE", label: "Terminées" },
  { value: "DISMISSED", label: "Ignorées" },
];

export function NotificationFiltersClient({
  activeStatus,
  search,
  severity,
  type,
  counts,
}: NotificationFiltersClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateQueryParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = searchInput.trim();
      if (normalized === search) return;
      updateQueryParams({ q: normalized || undefined });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search, searchInput, updateQueryParams]);

  const hasActiveFilters = useMemo(
    () =>
      activeStatus !== "ALL" ||
      severity !== "ALL" ||
      type !== "ALL" ||
      search.trim().length > 0,
    [activeStatus, severity, type, search],
  );

  const resetFilters = () =>
    updateQueryParams({
      status: undefined,
      severity: undefined,
      type: undefined,
      q: undefined,
    });

  return (
    <div className="rounded-2xl border border-subtle bg-white p-4 shadow-card">
      <div className="flex flex-col gap-4">
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="inline-flex min-w-full items-center gap-1 rounded-xl border border-subtle bg-slate-50/90 p-1 sm:min-w-0">
            {statusItems.map((item) => {
              const isActive = activeStatus === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    updateQueryParams({
                      status: item.value === "ALL" ? undefined : item.value,
                    })
                  }
                  className={cn(
                    "inline-flex min-w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900",
                  )}
                >
                  <span className="whitespace-nowrap">{item.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                      isActive ? "bg-white/15 text-white" : "bg-white text-slate-500",
                    )}
                  >
                    {counts[item.value]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_180px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Rechercher une alerte, un véhicule ou une plaque..."
              className="h-11 rounded-xl border-subtle bg-slate-50/60 pl-9 shadow-none placeholder:text-slate-400 focus-visible:ring-primary/20"
            />
          </div>

          <Select
            value={severity}
            onValueChange={(value) =>
              updateQueryParams({ severity: value === "ALL" ? undefined : value })
            }
          >
            <SelectTrigger className="h-11 rounded-xl border-subtle bg-white shadow-none">
              <SelectValue placeholder="Sévérité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes sévérités</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="WARNING">Attention</SelectItem>
              <SelectItem value="DUE">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={type}
            onValueChange={(value) =>
              updateQueryParams({ type: value === "ALL" ? undefined : value })
            }
          >
            <SelectTrigger className="h-11 rounded-xl border-subtle bg-white shadow-none">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              <SelectItem value="OIL_CHANGE">Vidange</SelectItem>
              <SelectItem value="INSURANCE_EXPIRY">Assurance</SelectItem>
              <SelectItem value="TECH_INSPECTION">Visite technique</SelectItem>
              <SelectItem value="VIGNETTE">Vignette</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center justify-end xl:justify-start">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="h-10 rounded-xl px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <FilterX className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
