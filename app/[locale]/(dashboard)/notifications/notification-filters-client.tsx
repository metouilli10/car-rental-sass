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
import { type AppLocale } from "@/lib/i18n/config";
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
  locale: AppLocale;
  activeStatus: NotificationStatusFilter;
  search: string;
  severity: NotificationSeverityFilter;
  type: NotificationTypeFilter;
  counts: Record<NotificationStatusFilter, number>;
}

export function NotificationFiltersClient({
  locale,
  activeStatus,
  search,
  severity,
  type,
  counts,
}: NotificationFiltersClientProps) {
  const copy =
    locale === "ar"
      ? {
          statuses: [
            { value: "ALL" as const, label: "الكل" },
            { value: "OPEN" as const, label: "مطلوب" },
            { value: "SNOOZED" as const, label: "مؤجلة" },
            { value: "DONE" as const, label: "مكتملة" },
            { value: "DISMISSED" as const, label: "متجاهلة" },
          ],
          searchPlaceholder: "ابحث عن تنبيه او مركبة او لوحة...",
          severityPlaceholder: "الحدة",
          severityAll: "كل الدرجات",
          severityInfo: "معلومة",
          severityWarning: "تنبيه",
          severityDue: "عاجل",
          typePlaceholder: "النوع",
          typeAll: "كل الأنواع",
          typeOil: "تغيير الزيت",
          typeInsurance: "التأمين",
          typeInspection: "الفحص التقني",
          typeVignette: "الضريبة",
          typeReservation: "انطلاق الحجز",
          reset: "إعادة التعيين",
        }
      : {
          statuses: [
            { value: "ALL" as const, label: "Tous" },
            { value: "OPEN" as const, label: "A faire" },
            { value: "SNOOZED" as const, label: "Snoozees" },
            { value: "DONE" as const, label: "Terminees" },
            { value: "DISMISSED" as const, label: "Ignorees" },
          ],
          searchPlaceholder: "Rechercher une alerte, un vehicule ou une plaque...",
          severityPlaceholder: "Severite",
          severityAll: "Toutes severites",
          severityInfo: "Info",
          severityWarning: "Attention",
          severityDue: "Urgent",
          typePlaceholder: "Type",
          typeAll: "Tous les types",
          typeOil: "Vidange",
          typeInsurance: "Assurance",
          typeInspection: "Visite technique",
          typeVignette: "Vignette",
          typeReservation: "Depart de reservation",
          reset: "Reinitialiser",
        };

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
            {copy.statuses.map((item) => {
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
              placeholder={copy.searchPlaceholder}
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
              <SelectValue placeholder={copy.severityPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{copy.severityAll}</SelectItem>
              <SelectItem value="INFO">{copy.severityInfo}</SelectItem>
              <SelectItem value="WARNING">{copy.severityWarning}</SelectItem>
              <SelectItem value="DUE">{copy.severityDue}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={type}
            onValueChange={(value) =>
              updateQueryParams({ type: value === "ALL" ? undefined : value })
            }
          >
            <SelectTrigger className="h-11 rounded-xl border-subtle bg-white shadow-none">
              <SelectValue placeholder={copy.typePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{copy.typeAll}</SelectItem>
              <SelectItem value="OIL_CHANGE">{copy.typeOil}</SelectItem>
              <SelectItem value="INSURANCE_EXPIRY">{copy.typeInsurance}</SelectItem>
              <SelectItem value="TECH_INSPECTION">{copy.typeInspection}</SelectItem>
              <SelectItem value="VIGNETTE">{copy.typeVignette}</SelectItem>
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
              {copy.reset}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
