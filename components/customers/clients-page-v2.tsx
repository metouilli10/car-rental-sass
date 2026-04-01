"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  FileText,
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientCardList } from "@/components/clients/ClientCardList";
import { useI18n } from "@/components/i18n/i18n-context";
import { withLocalePath } from "@/lib/i18n/config";

type ReservationFilterValue = "all" | "yes" | "no";

export interface ClientListItem {
  id: string;
  customerType: "PERSONNE_PHYSIQUE" | "PERSONNE_MORALE";
  name: string;
  email: string | null;
  phone: string;
  passportOrCIN: string | null;
  passportPhotoUrl: string | null;
  passportPhotoBackUrl: string | null;
  licensePhotoUrl: string | null;
  licensePhotoBackUrl: string | null;
  nationality: string;
  createdAt: string;
  bookingsCount: number;
  totalSpent: number;
  balance: number;
}

interface ClientsPageV2Props {
  customers: ClientListItem[];
  canManageCustomers: boolean;
  canDeleteCustomers: boolean;
  defaultSearch: string;
  stats: {
    totalClients: number;
    clientsWithReservations: number;
    clientsWithoutDocuments: number;
    clientsAddedThisMonth: number;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
  };
}

interface ToolbarFilters {
  language: string;
  hasDocuments: ReservationFilterValue;
  hasReservations: ReservationFilterValue;
  createdFrom: string;
  createdTo: string;
}

const DEFAULT_FILTERS: ToolbarFilters = {
  language: "all",
  hasDocuments: "all",
  hasReservations: "all",
  createdFrom: "",
  createdTo: "",
};

export function ClientsPageV2({
  customers,
  canManageCustomers,
  canDeleteCustomers,
  defaultSearch,
  stats,
  pagination,
}: ClientsPageV2Props) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchInput, setSearchInput] = useState(defaultSearch);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<ToolbarFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(defaultSearch);
  }, [defaultSearch]);

  useEffect(() => {
    const currentQuery = searchParams.get("q") ?? "";
    if (debouncedSearch === currentQuery) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
    } else {
      params.delete("q");
    }
    params.delete("page");

    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [debouncedSearch, pathname, router, searchParams]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const hasDocuments = Boolean(
        customer.passportPhotoUrl ||
        customer.passportPhotoBackUrl ||
        customer.licensePhotoUrl ||
        customer.licensePhotoBackUrl,
      );
      const hasReservations = customer.bookingsCount > 0;
      const createdAtMs = new Date(customer.createdAt).getTime();
      const createdFromMs = filters.createdFrom ? new Date(filters.createdFrom).getTime() : null;
      const createdToMs = filters.createdTo
        ? new Date(`${filters.createdTo}T23:59:59`).getTime()
        : null;

      if (
        filters.language !== "all" &&
        customer.nationality.toLowerCase() !== filters.language.toLowerCase()
      ) {
        return false;
      }

      if (
        (filters.hasDocuments === "yes" && !hasDocuments) ||
        (filters.hasDocuments === "no" && hasDocuments)
      ) {
        return false;
      }

      if (
        (filters.hasReservations === "yes" && !hasReservations) ||
        (filters.hasReservations === "no" && hasReservations)
      ) {
        return false;
      }

      if (createdFromMs && createdAtMs < createdFromMs) {
        return false;
      }

      if (createdToMs && createdAtMs > createdToMs) {
        return false;
      }

      return true;
    });
  }, [customers, filters]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (debouncedSearch) {
      chips.push({
        id: "search",
        label: t("customers.chipSearch", { q: debouncedSearch }),
        onRemove: () => setSearchInput(""),
      });
    }
    if (filters.language !== "all") {
      chips.push({
        id: "language",
        label: t("customers.chipNationality", { value: filters.language }),
        onRemove: () => setFilters((prev) => ({ ...prev, language: "all" })),
      });
    }
    if (filters.hasDocuments !== "all") {
      chips.push({
        id: "docs",
        label: t("customers.chipDocuments", {
          value: filters.hasDocuments === "yes" ? t("customers.yes") : t("customers.no"),
        }),
        onRemove: () => setFilters((prev) => ({ ...prev, hasDocuments: "all" })),
      });
    }
    if (filters.hasReservations !== "all") {
      chips.push({
        id: "bookings",
        label: t("customers.chipBookings", {
          value: filters.hasReservations === "yes" ? t("customers.yes") : t("customers.no"),
        }),
        onRemove: () => setFilters((prev) => ({ ...prev, hasReservations: "all" })),
      });
    }
    if (filters.createdFrom || filters.createdTo) {
      chips.push({
        id: "createdAt",
        label: t("customers.chipCreatedRange", {
          from: filters.createdFrom || "…",
          to: filters.createdTo || "…",
        }),
        onRemove: () =>
          setFilters((prev) => ({ ...prev, createdFrom: "", createdTo: "" })),
      });
    }

    return chips;
  }, [debouncedSearch, filters, t]);

  const languageOptions = useMemo(() => {
    const unique = new Set(customers.map((customer) => customer.nationality).filter(Boolean));
    return Array.from(unique);
  }, [customers]);

  const monthStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  }, []);

  const monthEnd = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  }, []);

  const activeMetricFilter = useMemo<"all" | "reservations" | "noDocuments" | "addedThisMonth">(() => {
    if (filters.hasReservations === "yes") {
      return "reservations";
    }
    if (filters.hasDocuments === "no") {
      return "noDocuments";
    }
    if (filters.createdFrom === monthStart && filters.createdTo === monthEnd) {
      return "addedThisMonth";
    }
    return "all";
  }, [filters, monthEnd, monthStart]);

  const handleMetricFilter = (metric: "all" | "reservations" | "noDocuments" | "addedThisMonth") => {
    if (metric === activeMetricFilter) {
      setFilters((prev) => ({
        ...prev,
        hasReservations: "all",
        hasDocuments: "all",
        createdFrom: "",
        createdTo: "",
      }));
      return;
    }

    setFilters((prev) => {
      if (metric === "all") {
        return {
          ...prev,
          hasReservations: "all",
          hasDocuments: "all",
          createdFrom: "",
          createdTo: "",
        };
      }

      if (metric === "reservations") {
        return {
          ...prev,
          hasReservations: "yes",
          hasDocuments: "all",
          createdFrom: "",
          createdTo: "",
        };
      }

      if (metric === "noDocuments") {
        return {
          ...prev,
          hasReservations: "all",
          hasDocuments: "no",
          createdFrom: "",
          createdTo: "",
        };
      }

      return {
        ...prev,
        hasReservations: "all",
        hasDocuments: "all",
        createdFrom: monthStart,
        createdTo: monthEnd,
      };
    });
  };

  const exportCustomersToCsv = () => {
    const headers = [
      t("customers.csvName"),
      t("customers.csvType"),
      t("customers.csvEmail"),
      t("customers.csvPhone"),
      t("customers.csvNationality"),
      t("customers.csvId"),
      t("customers.csvBookings"),
      t("customers.csvTotalSpent"),
      t("customers.csvBalance"),
      t("customers.csvCreated"),
    ];

    const escapeCsvValue = (value: string | number | null | undefined) => {
      const normalized = String(value ?? "").replace(/"/g, '""');
      return `"${normalized}"`;
    };

    const rows = filteredCustomers.map((customer) => [
      customer.name,
      customer.customerType === "PERSONNE_MORALE"
        ? t("customers.companyType")
        : t("customers.individualType"),
      customer.email ?? "",
      customer.phone,
      customer.nationality,
      customer.passportOrCIN ?? "",
      customer.bookingsCount,
      customer.totalSpent,
      customer.balance,
      formatDate(customer.createdAt),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `clients-${now}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider delayDuration={250}>
      <div className="space-y-6 bg-slate-50/70 p-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <ClientsPageHeader
            canManageCustomers={canManageCustomers}
            onExport={exportCustomersToCsv}
            canExport={filteredCustomers.length > 0}
          />
          <MetricsGrid
            stats={stats}
            activeMetricFilter={activeMetricFilter}
            onMetricFilterChange={handleMetricFilter}
          />
          <ClientsToolbar
            filters={filters}
            onFiltersChange={setFilters}
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            languageOptions={languageOptions}
            showDeleted={showDeleted}
            onShowDeletedChange={setShowDeleted}
            activeFilterChips={activeFilterChips}
            onExport={exportCustomersToCsv}
            canExport={filteredCustomers.length > 0}
          />
          {filteredCustomers.length === 0 ? (
            <EmptyClientsState canManageCustomers={canManageCustomers} />
          ) : (
            <>
              <div className="md:hidden">
                <ClientCardList
                  clients={filteredCustomers}
                  canDeleteCustomers={canDeleteCustomers}
                  canManageCustomers={canManageCustomers}
                />
              </div>
              <div className="hidden md:block">
                <ClientsTable
                  rows={filteredCustomers}
                  canDeleteCustomers={canDeleteCustomers}
                  canManageCustomers={canManageCustomers}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>
            </>
          )}
          <PaginationRow
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            searchQuery={defaultSearch}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

function EmptyClientsState({ canManageCustomers }: { canManageCustomers: boolean }) {
  const { t, locale } = useI18n();
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center">
      <h3 className="text-base font-semibold text-slate-900">{t("customers.emptyTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("customers.emptyHint")}</p>
      {canManageCustomers ? (
        <Button asChild className="mt-4">
          <Link href={withLocalePath(locale, "/customers/add")}>
            <UserPlus className="h-4 w-4" />
            {t("customers.addClient")}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

function ClientsPageHeader({
  canManageCustomers,
  onExport,
  canExport,
}: {
  canManageCustomers: boolean;
  onExport: () => void;
  canExport: boolean;
}) {
  const { t, locale } = useI18n();
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t("customers.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("customers.subtitle")}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-10"
          aria-label={t("customers.exportAria")}
          onClick={onExport}
          disabled={!canExport}
        >
          {t("customers.export")}
        </Button>
        {canManageCustomers ? (
          <Button asChild className="h-10" aria-label={t("customers.addClientAria")}>
            <Link href={withLocalePath(locale, "/customers/add")}>
              <UserPlus className="h-4 w-4" />
              {t("customers.addClient")}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function MetricsGrid({
  stats,
  activeMetricFilter,
  onMetricFilterChange,
}: {
  stats: ClientsPageV2Props["stats"];
  activeMetricFilter: "all" | "reservations" | "noDocuments" | "addedThisMonth";
  onMetricFilterChange: (metric: "all" | "reservations" | "noDocuments" | "addedThisMonth") => void;
}) {
  const { t } = useI18n();
  const cards = [
    {
      label: t("customers.metricTotal"),
      value: stats.totalClients,
      icon: Users,
      filterKey: "all" as const,
    },
    {
      label: t("customers.metricWithBookings"),
      value: stats.clientsWithReservations,
      icon: Calendar,
      filterKey: "reservations" as const,
    },
    {
      label: t("customers.metricNoDocs"),
      value: stats.clientsWithoutDocuments,
      icon: FileText,
      filterKey: "noDocuments" as const,
    },
    {
      label: t("customers.metricAddedMonth"),
      value: stats.clientsAddedThisMonth,
      icon: UserPlus,
      filterKey: "addedThisMonth" as const,
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      {cards.map((card, index) => {
        const isFirst = index === 0;
        const isActive = activeMetricFilter === card.filterKey;
        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onMetricFilterChange(card.filterKey)}
            className={`rounded-xl border p-3 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-4 ${
              isFirst
                ? "border-blue-200 bg-blue-50"
                : isActive
                  ? "border-border bg-card hover:border-slate-300"
                  : "border-border bg-card hover:border-slate-300 hover:bg-slate-50/50"
            }`}
            aria-pressed={isActive}
            aria-label={t("customers.filterAria", { label: card.label })}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase leading-snug tracking-wider text-muted-foreground sm:text-xs">
                {card.label}
              </p>
              <card.icon
                className={`h-4 w-4 shrink-0 ${isFirst ? "text-blue-600" : isActive ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <p className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{card.value}</p>
          </button>
        );
      })}
    </div>
  );
}

function ClientsToolbar({
  filters,
  onFiltersChange,
  searchInput,
  onSearchChange,
  languageOptions,
  showDeleted,
  onShowDeletedChange,
  activeFilterChips,
  onExport,
  canExport,
}: {
  filters: ToolbarFilters;
  onFiltersChange: (filters: ToolbarFilters) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  languageOptions: string[];
  showDeleted: boolean;
  onShowDeletedChange: (value: boolean) => void;
  activeFilterChips: Array<{ id: string; label: string; onRemove: () => void }>;
  onExport: () => void;
  canExport: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md md:max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={t("customers.searchAria")}
              placeholder={t("customers.searchPlaceholder")}
              className="pr-10 pl-9"
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            {searchInput ? (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => onSearchChange("")}
                aria-label={t("customers.clearSearchAria")}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10">
                <SlidersHorizontal className="h-4 w-4" />
                {t("customers.filters")}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[340px] space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("customers.nationality")}
                </label>
                <select
                  value={filters.language}
                  onChange={(event) =>
                    onFiltersChange({ ...filters, language: event.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm shadow-sm outline-none ring-0 transition focus:border-primary"
                  aria-label={t("customers.nationality")}
                >
                  <option value="all">{t("customers.allFeminine")}</option>
                  {languageOptions.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("customers.hasDocuments")}
                  </label>
                  <select
                    value={filters.hasDocuments}
                    onChange={(event) =>
                      onFiltersChange({
                        ...filters,
                        hasDocuments: event.target.value as ReservationFilterValue,
                      })
                    }
                    className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-primary"
                    aria-label={t("customers.hasDocuments")}
                  >
                    <option value="all">{t("customers.allMasculine")}</option>
                    <option value="yes">{t("customers.yes")}</option>
                    <option value="no">{t("customers.no")}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("customers.hasBookings")}
                  </label>
                  <select
                    value={filters.hasReservations}
                    onChange={(event) =>
                      onFiltersChange({
                        ...filters,
                        hasReservations: event.target.value as ReservationFilterValue,
                      })
                    }
                    className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-primary"
                    aria-label={t("customers.hasBookings")}
                  >
                    <option value="all">{t("customers.allMasculine")}</option>
                    <option value="yes">{t("customers.yes")}</option>
                    <option value="no">{t("customers.no")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("customers.dateStart")}
                  </label>
                  <Input
                    type="date"
                    value={filters.createdFrom}
                    onChange={(event) =>
                      onFiltersChange({ ...filters, createdFrom: event.target.value })
                    }
                    aria-label={t("customers.dateFromAria")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("customers.dateEnd")}
                  </label>
                  <Input
                    type="date"
                    value={filters.createdTo}
                    onChange={(event) =>
                      onFiltersChange({ ...filters, createdTo: event.target.value })
                    }
                    aria-label={t("customers.dateToAria")}
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                >
                  {t("customers.resetFilters")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            role="switch"
            aria-checked={showDeleted}
            onClick={() => onShowDeletedChange(!showDeleted)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={t("customers.showDeletedAria")}
          >
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                showDeleted ? "bg-primary" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition ${
                  showDeleted ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </span>
            {t("customers.showDeleted")}
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            aria-label={t("customers.exportAria")}
            onClick={onExport}
            disabled={!canExport}
          >
            {t("customers.export")}
          </Button>
        </div>
      </div>

      {activeFilterChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              aria-label={t("customers.removeFilterAria", { label: chip.label })}
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PaginationRow({
  currentPage,
  totalPages,
  searchQuery,
}: {
  currentPage: number;
  totalPages: number;
  searchQuery: string;
}) {
  const { t } = useI18n();
  const pathname = usePathname();

  if (totalPages <= 1) {
    return null;
  }

  const prevParams = new URLSearchParams();
  prevParams.set("page", String(Math.max(1, currentPage - 1)));
  if (searchQuery) {
    prevParams.set("q", searchQuery);
  }

  const nextParams = new URLSearchParams();
  nextParams.set("page", String(Math.min(totalPages, currentPage + 1)));
  if (searchQuery) {
    nextParams.set("q", searchQuery);
  }

  const prevHref = `${pathname}?${prevParams.toString()}`;
  const nextHref = `${pathname}?${nextParams.toString()}`;

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        {t("pagination.pageOf", { current: currentPage, total: totalPages })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          asChild
          size="sm"
          variant="outline"
          aria-label={t("pagination.prevAria")}
          disabled={currentPage <= 1}
        >
          <Link href={prevHref}>{t("pagination.previous")}</Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          aria-label={t("pagination.nextAria")}
          disabled={currentPage >= totalPages}
        >
          <Link href={nextHref}>{t("pagination.next")}</Link>
        </Button>
      </div>
    </div>
  );
}
