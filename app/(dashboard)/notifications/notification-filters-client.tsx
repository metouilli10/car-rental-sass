"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const updateQueryParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = searchInput.trim();
      if (normalized === search) return;
      updateQueryParams({ q: normalized || undefined });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [pathname, router, search, searchInput, searchParams]);

  const statusItems: Array<{ value: NotificationStatusFilter; label: string }> = [
    { value: "ALL", label: "Tous" },
    { value: "OPEN", label: "À faire" },
    { value: "SNOOZED", label: "Snoozées" },
    { value: "DONE", label: "Terminées" },
    { value: "DISMISSED", label: "Ignorées" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {statusItems.map((item) => {
          const isActive = activeStatus === item.value;
          return (
            <Button
              key={item.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() =>
                updateQueryParams({
                  status: item.value === "ALL" ? undefined : item.value,
                })
              }
              className="gap-2"
            >
              <span>{item.label}</span>
              <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold text-current">
                {counts[item.value]}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher titre, véhicule, plaque..."
            className="pl-9"
          />
        </div>

        <Select
          value={severity}
          onValueChange={(value) =>
            updateQueryParams({ severity: value === "ALL" ? undefined : value })
          }
        >
          <SelectTrigger>
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
          <SelectTrigger>
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

        <Button
          variant="ghost"
          onClick={() =>
            updateQueryParams({
              status: undefined,
              severity: undefined,
              type: undefined,
              q: undefined,
            })
          }
        >
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}
