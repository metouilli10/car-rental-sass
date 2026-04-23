"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VehiclesSearchBarProps {
  defaultValue?: string;
  statusFilter?: string;
}

export function VehiclesSearchBar({
  defaultValue = "",
  statusFilter,
}: VehiclesSearchBarProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  const updateSearch = useCallback(
    (q: string) => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (q) params.set("q", q);
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, statusFilter]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setValue(q);
    updateSearch(q);
  };

  const handleClear = () => {
    setValue("");
    updateSearch("");
  };

  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      <div className="relative flex-1 min-w-0 max-w-sm">
        <Search
          className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${
            isPending ? "text-primary" : "text-muted-foreground"
          }`}
        />
        <Input
          value={value}
          onChange={handleChange}
          placeholder={t("vehicles.searchPlaceholder")}
          className="h-10 w-full bg-white pl-9 pr-8"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={t("vehicles.searchClearAria")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Button type="button" variant="secondary" className="h-10 shrink-0 gap-2 whitespace-nowrap">
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">{t("vehicles.filtersButton")}</span>
      </Button>
    </div>
  );
}
