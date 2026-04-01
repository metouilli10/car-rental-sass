import { canDeleteVehicles, canManageVehicles } from "@/lib/permissions";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { Pagination } from "@/components/shared/pagination";
import Link from "next/link";
import { Plus, FileSpreadsheet, Car } from "lucide-react";
import { VehiclesSearchBar } from "@/components/vehicles/vehicles-search-bar";
import { VehiclesList } from "@/components/vehicles/vehicles-list";
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
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {ui.vehicles.title}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {ui.vehicles.subtitle}
          </p>
        </div>
        {canManage ? (
          <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
            <Link
              href={lp("/vehicles/import")}
              className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-medium text-blue-700 transition-colors duration-200 hover:bg-blue-100 sm:flex-none sm:px-4 sm:text-sm"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {ui.vehicles.importExcel}
            </Link>
            <Link
              href={lp("/vehicles/add")}
              className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-medium text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 sm:flex-none sm:px-4 sm:text-sm"
            >
              <Plus className="h-4 w-4" />
              {ui.vehicles.addVehicle}
            </Link>
          </div>
        ) : null}
      </div>

      {/* ── Section 1: Status filter ── */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider sm:text-[11px]">
          {ui.vehicles.statusSection}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-muted rounded-xl w-full">
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
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-600 hover:bg-blue-50"
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center rounded-full text-[10px] font-bold min-w-[18px] h-[18px] px-1 tabular-nums ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-gray-200/80 text-gray-600"
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
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-white shadow-sm border border-border">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-100 flex items-center justify-center mb-4">
            <Car className="h-7 w-7 text-blue-600/80" />
          </div>
          <p className="text-gray-700 text-sm font-medium mb-1">
            {!statusFilter && !searchQuery ? ui.vehicles.emptyFleetTitle : emptyMessage}
          </p>
          <p className="text-gray-400 text-xs mb-5">
            {!searchQuery && !statusFilter
              ? ui.vehicles.emptyFleetHint
              : ui.vehicles.emptyAdjustHint}
          </p>
          {!statusFilter && !searchQuery && (
            <Link
              href={lp("/vehicles/add")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              {ui.vehicles.addVehicle}
            </Link>
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
            <div className="rounded-xl border border-border bg-white shadow-sm">
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
