import { canDeleteVehicles, canManageVehicles } from "@/lib/permissions";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { Pagination } from "@/components/shared/pagination";
import Link from "next/link";
import { Plus, FileSpreadsheet, Car } from "lucide-react";
import { VehiclesSearchBar } from "@/components/vehicles/vehicles-search-bar";
import { VehiclesList } from "@/components/vehicles/vehicles-list";
import { Button } from "@/components/ui/button";
import type { BookingStatus, VehicleStatus } from "@prisma/client";
import { getMessages, interpolate } from "@/lib/i18n/messages";
import { isValidLocale, withLocalePath, type AppLocale } from "@/lib/i18n/config";

const PAGE_SIZE = 25;

type SearchParams = { status?: string; page?: string; q?: string };

const VALID_STATUSES = ["AVAILABLE", "RENTED", "MAINTENANCE", "UNAVAILABLE"] as const;

export default async function VehiclesPage({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: AppLocale = isValidLocale(localeParam) ? localeParam : "fr";
  const ui = getMessages(locale);
  const lp = (path: string) => withLocalePath(locale, path);

  const currentUser = await getCurrentUserAccessForPage();

  const { status, page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const now = new Date();
  const canManage = canManageVehicles(
    currentUser.role,
    currentUser.permissions,
  );
  const canDelete = canDeleteVehicles(
    currentUser.role,
    currentUser.permissions,
  );

  const statusFilter =
    status && (VALID_STATUSES as readonly string[]).includes(status)
      ? (status as VehicleStatus)
      : undefined;

  const searchQuery = q?.trim() || undefined;

  const baseWhere = { agencyId: currentUser.agencyId };
  const currentRentalStatuses: BookingStatus[] = ["ACTIVE", "CONFIRMED"];
  const currentRentalWhere = {
    OR: [
      { status: "RENTED" as VehicleStatus },
      {
        bookings: {
          some: {
            status: { in: currentRentalStatuses },
            startDate: { lte: now },
            endDate: { gte: now },
          },
        },
      },
    ],
  };
  const isRentedView = statusFilter === "RENTED";
  const isAvailableView = statusFilter === "AVAILABLE";
  const currentAvailableWhere = {
    status: "AVAILABLE" as VehicleStatus,
    NOT: {
      bookings: {
        some: {
          status: { in: currentRentalStatuses },
          startDate: { lte: now },
          endDate: { gte: now },
        },
      },
    },
  };

  const where = {
    ...baseWhere,
    ...(statusFilter
      ? isRentedView
        ? currentRentalWhere
        : isAvailableView
        ? currentAvailableWhere
        : { status: statusFilter }
      : {}),
    ...(searchQuery
      ? {
          OR: [
            { make: { contains: searchQuery } },
            { model: { contains: searchQuery } },
            { plate: { contains: searchQuery } },
          ],
        }
      : {}),
  };

  const [vehicles, total, statusCounts, currentRentedCount, currentAvailableCount] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        make: true,
        brandKey: true,
        model: true,
        plate: true,
        year: true,
        color: true,
        gearbox: true,
        pricePerDay: true,
        status: true,
        bookings: {
          where:
            isRentedView || isAvailableView
              ? {
                  status: { in: currentRentalStatuses },
                  startDate: { lte: now },
                  endDate: { gte: now },
                }
              : { status: "ACTIVE" },
          take: 1,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            customer: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.vehicle.count({ where }),
    prisma.vehicle.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { status: true },
    }),
    prisma.vehicle.count({
      where: {
        ...baseWhere,
        ...currentRentalWhere,
      },
    }),
    prisma.vehicle.count({
      where: {
        ...baseWhere,
        ...currentAvailableWhere,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const countMap: Record<string, number> = {};
  let totalCount = 0;
  for (const item of statusCounts) {
    countMap[item.status] = item._count.status;
    totalCount += item._count.status;
  }
  countMap.RENTED = currentRentedCount;
  countMap.AVAILABLE = currentAvailableCount;

  const emptyMessage =
    statusFilter === "AVAILABLE"
      ? ui.vehicles.emptyAvailable
      : statusFilter === "RENTED"
        ? ui.vehicles.emptyRented
        : statusFilter === "MAINTENANCE"
          ? ui.vehicles.emptyMaintenance
          : statusFilter === "UNAVAILABLE"
            ? ui.vehicles.emptyUnavailable
            : searchQuery
              ? interpolate(ui.vehicles.emptySearch, { q: searchQuery })
              : ui.vehicles.emptyDefault;

  const statusTabs: { key: VehicleStatus | undefined; label: string }[] = [
    { key: undefined, label: ui.vehicles.tabAll },
    { key: "AVAILABLE", label: ui.vehicles.tabAvailable },
    { key: "RENTED", label: ui.vehicles.tabRented },
    { key: "MAINTENANCE", label: ui.vehicles.tabMaintenance },
    { key: "UNAVAILABLE", label: ui.vehicles.tabUnavailable },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {ui.vehicles.title}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ui.vehicles.subtitle}
          </p>
        </div>
        {canManage ? (
          <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
            <Button asChild variant="secondary" className="h-10 flex-1 sm:flex-none">
              <Link href={lp("/vehicles/import")}>
                <FileSpreadsheet className="h-4 w-4" />
                {ui.vehicles.importExcel}
              </Link>
            </Button>
            <Button asChild className="h-10 flex-1 sm:flex-none">
              <Link href={lp("/vehicles/add")}>
                <Plus className="h-4 w-4" />
                {ui.vehicles.addVehicle}
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider sm:text-[11px]">
          {ui.vehicles.statusSection}
        </p>
        <div className="flex w-full flex-wrap items-center gap-1.5 rounded-2xl border border-subtle bg-white p-1.5 shadow-card">
          {statusTabs.map((tab) => {
            const isActive =
              statusFilter === tab.key ||
              (!statusFilter && tab.key === undefined);
            const count =
              tab.key !== undefined ? (countMap[tab.key] ?? 0) : totalCount;
            const href =
              tab.key !== undefined
                ? lp(`/vehicles?status=${tab.key}`)
                : lp("/vehicles");

            return (
              <Link
                key={tab.key ?? "all"}
                href={href}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-transparent text-muted-foreground hover:bg-[hsl(var(--surface-muted))] hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-[hsl(var(--surface-muted))] text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Search ── */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider sm:text-[11px]">
          {ui.vehicles.searchSection}
        </p>
        <VehiclesSearchBar defaultValue={searchQuery} statusFilter={status} />
      </div>

      {/* ── Content ── */}
      {vehicles.length === 0 && page === 1 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-subtle bg-white py-20 shadow-card">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
            <Car className="h-7 w-7" />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-800">
            {!statusFilter && !searchQuery ? ui.vehicles.emptyFleetTitle : emptyMessage}
          </p>
          <p className="mb-5 text-xs text-muted-foreground">
            {!searchQuery && !statusFilter
              ? ui.vehicles.emptyFleetHint
              : ui.vehicles.emptyAdjustHint}
          </p>
          {!statusFilter && !searchQuery && (
            <Button asChild>
              <Link href={lp("/vehicles/add")}>
                <Plus className="h-4 w-4" />
                {ui.vehicles.addVehicle}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <VehiclesList
            vehicles={vehicles}
            isRentedView={isRentedView}
            canManageVehicles={canManage}
            canDeleteVehicles={canDelete}
            statusFilter={statusFilter}
          />
          {totalPages > 1 ? (
            <div className="rounded-2xl border border-subtle bg-white shadow-card">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl={lp("/vehicles")}
                searchParams={{ status, q }}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
