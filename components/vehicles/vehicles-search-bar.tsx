"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface VehiclesSearchBarProps {
  defaultValue?: string;
  statusFilter?: string;
}

export function VehiclesSearchBar({
  defaultValue = "",
  statusFilter,
}: VehiclesSearchBarProps) {
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
    <div className="flex items-center gap-3 w-full min-w-0">
      <div className="relative flex-1 min-w-0 max-w-sm">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${
            isPending ? "text-blue-600" : "text-gray-400"
          }`}
        />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Rechercher par modèle, plaque..."
          className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200 placeholder:text-gray-400 text-gray-900"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Effacer la recherche"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <button className="flex shrink-0 items-center gap-2 px-3.5 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium whitespace-nowrap">
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">Filtres</span>
      </button>
    </div>
  );
}
