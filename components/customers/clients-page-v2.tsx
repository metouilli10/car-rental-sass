"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { UserRole } from "@prisma/client";
import {
  AlertTriangle,
  Calendar,
  FileText,
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CustomerRowActions } from "@/components/customers/customer-row-actions";

type ReservationFilterValue = "all" | "yes" | "no";

export interface ClientListItem {
  id: string;
  customerType: "PERSONNE_PHYSIQUE" | "PERSONNE_MORALE";
  name: string;
  email: string | null;
  phone: string;
  passportOrCIN: string | null;
  passportPhotoUrl: string | null;
  licensePhotoUrl: string | null;
  nationality: string;
  createdAt: string;
  bookingsCount: number;
  totalSpent: number;
  balance: number;
}

interface ClientsPageV2Props {
  customers: ClientListItem[];
  currentUserRole: UserRole;
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

export function ClientsPageV2({ customers, currentUserRole, stats, pagination }: ClientsPageV2Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<ToolbarFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const hasDocuments = Boolean(customer.passportPhotoUrl || customer.licensePhotoUrl);
      const hasReservations = customer.bookingsCount > 0;
      const createdAtMs = new Date(customer.createdAt).getTime();
      const createdFromMs = filters.createdFrom ? new Date(filters.createdFrom).getTime() : null;
      const createdToMs = filters.createdTo
        ? new Date(`${filters.createdTo}T23:59:59`).getTime()
        : null;

      if (debouncedSearch) {
        const haystack = [
          customer.name,
          customer.email ?? "",
          customer.phone,
          customer.passportOrCIN ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(debouncedSearch)) {
          return false;
        }
      }

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
  }, [customers, debouncedSearch, filters]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (debouncedSearch) {
      chips.push({
        id: "search",
        label: `Recherche: ${debouncedSearch}`,
        onRemove: () => setSearchInput(""),
      });
    }
    if (filters.language !== "all") {
      chips.push({
        id: "language",
        label: `Langue: ${filters.language}`,
        onRemove: () => setFilters((prev) => ({ ...prev, language: "all" })),
      });
    }
    if (filters.hasDocuments !== "all") {
      chips.push({
        id: "docs",
        label: `Documents: ${filters.hasDocuments === "yes" ? "Oui" : "Non"}`,
        onRemove: () => setFilters((prev) => ({ ...prev, hasDocuments: "all" })),
      });
    }
    if (filters.hasReservations !== "all") {
      chips.push({
        id: "bookings",
        label: `Reservations: ${filters.hasReservations === "yes" ? "Oui" : "Non"}`,
        onRemove: () => setFilters((prev) => ({ ...prev, hasReservations: "all" })),
      });
    }
    if (filters.createdFrom || filters.createdTo) {
      chips.push({
        id: "createdAt",
        label: `Cree entre ${filters.createdFrom || "..."} et ${filters.createdTo || "..."}`,
        onRemove: () =>
          setFilters((prev) => ({ ...prev, createdFrom: "", createdTo: "" })),
      });
    }

    return chips;
  }, [debouncedSearch, filters]);

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
      "Nom",
      "Type",
      "Email",
      "Telephone",
      "Nationalite",
      "Passeport/CIN",
      "Reservations",
      "Total depense",
      "Solde",
      "Date creation",
    ];

    const escapeCsvValue = (value: string | number | null | undefined) => {
      const normalized = String(value ?? "").replace(/"/g, '""');
      return `"${normalized}"`;
    };

    const rows = filteredCustomers.map((customer) => [
      customer.name,
      customer.customerType === "PERSONNE_MORALE" ? "Entreprise" : "Particulier",
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
          <PageHeader
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
          />
          <ClientsTable
            rows={filteredCustomers}
            currentUserRole={currentUserRole}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <PaginationRow currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
        </div>
      </div>
    </TooltipProvider>
  );
}

function PageHeader({
  onExport,
  canExport,
}: {
  onExport: () => void;
  canExport: boolean;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerez vos clients et leurs informations
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-10"
          aria-label="Exporter les clients"
          onClick={onExport}
          disabled={!canExport}
        >
          Exporter
        </Button>
        <Button asChild className="h-10" aria-label="Ajouter un client">
          <Link href="/customers/add">
            <UserPlus className="h-4 w-4" />
            Ajouter un client
          </Link>
        </Button>
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
  const cards = [
    {
      label: "Total clients",
      value: stats.totalClients,
      icon: Users,
      filterKey: "all" as const,
    },
    {
      label: "Clients avec reservations",
      value: stats.clientsWithReservations,
      icon: Calendar,
      filterKey: "reservations" as const,
    },
    {
      label: "Sans documents",
      value: stats.clientsWithoutDocuments,
      icon: FileText,
      filterKey: "noDocuments" as const,
    },
    {
      label: "Ajoutes ce mois",
      value: stats.clientsAddedThisMonth,
      icon: UserPlus,
      filterKey: "addedThisMonth" as const,
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const isActive = activeMetricFilter === card.filterKey;
        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onMetricFilterChange(card.filterKey)}
            className={`rounded-xl border p-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              isActive
                ? "border-primary/40 bg-primary/5"
                : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100/60"
            }`}
            aria-pressed={isActive}
            aria-label={`Filtrer: ${card.label}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</p>
              <card.icon
                className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <p className="text-2xl font-semibold tracking-tight text-slate-900">{card.value}</p>
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
}: {
  filters: ToolbarFilters;
  onFiltersChange: (filters: ToolbarFilters) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  languageOptions: string[];
  showDeleted: boolean;
  onShowDeletedChange: (value: boolean) => void;
  activeFilterChips: Array<{ id: string; label: string; onRemove: () => void }>;
}) {
  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Rechercher un client"
              placeholder="Rechercher par nom, email, telephone..."
              className="pr-10 pl-9"
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            {searchInput ? (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => onSearchChange("")}
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10">
                <SlidersHorizontal className="h-4 w-4" />
                Filtres
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[340px] space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Langue
                </label>
                <select
                  value={filters.language}
                  onChange={(event) =>
                    onFiltersChange({ ...filters, language: event.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm shadow-sm outline-none ring-0 transition focus:border-primary"
                  aria-label="Filtrer par langue"
                >
                  <option value="all">Toutes</option>
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
                    A des documents
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
                    aria-label="Filtrer les documents"
                  >
                    <option value="all">Tous</option>
                    <option value="yes">Oui</option>
                    <option value="no">Non</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    A des reservations
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
                    aria-label="Filtrer les reservations"
                  >
                    <option value="all">Tous</option>
                    <option value="yes">Oui</option>
                    <option value="no">Non</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date de debut
                  </label>
                  <Input
                    type="date"
                    value={filters.createdFrom}
                    onChange={(event) =>
                      onFiltersChange({ ...filters, createdFrom: event.target.value })
                    }
                    aria-label="Date de creation a partir de"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date de fin
                  </label>
                  <Input
                    type="date"
                    value={filters.createdTo}
                    onChange={(event) =>
                      onFiltersChange({ ...filters, createdTo: event.target.value })
                    }
                    aria-label="Date de creation jusqu'a"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                >
                  Reinitialiser
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={showDeleted}
          onClick={() => onShowDeletedChange(!showDeleted)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Afficher les clients supprimes"
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
          Afficher supprimes
        </button>
      </div>

      {activeFilterChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              aria-label={`Supprimer le filtre ${chip.label}`}
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

function ClientsTable({
  rows,
  currentUserRole,
  selectedId,
  onSelect,
}: {
  rows: ClientListItem[];
  currentUserRole: UserRole;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center">
        <h3 className="text-base font-semibold text-slate-900">Aucun client ne correspond</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajustez vos filtres ou ajoutez un nouveau client.
        </p>
        <Button asChild className="mt-4">
          <Link href="/customers/add">
            <UserPlus className="h-4 w-4" />
            Ajouter un client
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[920px] border-collapse">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white">
            <tr>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                Nom
              </th>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                Contact
              </th>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                Passeport/CIN
              </th>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                Reservations
              </th>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                Total depense
              </th>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                Solde
              </th>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                Cree le
              </th>
              <th className="px-5 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((customer) => {
              const isSelected = selectedId === customer.id;
              const subtitle =
                customer.customerType === "PERSONNE_MORALE"
                  ? "Client entreprise"
                  : customer.email || "Client individuel";
              const hasOutstandingBalance = customer.balance > 0;

              return (
                <tr
                  key={customer.id}
                  onClick={() => onSelect(customer.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-slate-100/70"
                      : hasOutstandingBalance
                        ? "bg-amber-50/30 hover:bg-amber-50/50"
                        : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700">
                        {customer.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/clients/${customer.id}`}
                          className="truncate text-sm font-medium text-slate-900 hover:text-primary hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {customer.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block max-w-[220px] truncate text-sm text-slate-900 hover:text-primary hover:underline"
                            aria-label={`Contacter ${customer.name} sur WhatsApp`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            {customer.phone}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>{customer.phone}</TooltipContent>
                      </Tooltip>
                      {customer.email ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                              {customer.email}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>{customer.email}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <p className="text-xs text-muted-foreground">Pas d&apos;email</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {customer.passportOrCIN ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block max-w-[170px] truncate">
                            {customer.passportOrCIN}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{customer.passportOrCIN}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground">Non renseigne</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/reservations?clientId=${customer.id}`);
                      }}
                      aria-label={`Voir les réservations de ${customer.name}`}
                    >
                      <Badge variant="secondary">{customer.bookingsCount}</Badge>
                    </Button>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                  <td className="px-5 py-4">
                    {hasOutstandingBalance ? (
                      <Badge variant="warning" className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {formatCurrency(customer.balance)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">{formatCurrency(customer.balance)}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                    <CustomerRowActions
                      customerId={customer.id}
                      canDelete={currentUserRole === "OWNER" || currentUserRole === "MANAGER"}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaginationRow({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Page {currentPage} sur {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          asChild
          size="sm"
          variant="outline"
          aria-label="Page precedente"
          disabled={currentPage <= 1}
        >
          <Link href={`/customers?page=${Math.max(1, currentPage - 1)}`}>Precedent</Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          aria-label="Page suivante"
          disabled={currentPage >= totalPages}
        >
          <Link href={`/customers?page=${Math.min(totalPages, currentPage + 1)}`}>Suivant</Link>
        </Button>
      </div>
    </div>
  );
}
