import { redirect } from "next/navigation";
import { canDeleteVehicles, canManageVehicles } from "@/lib/permissions";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { Pagination } from "@/components/shared/pagination";
import Link from "next/link";
import { Plus, FileSpreadsheet, Car } from "lucide-react";
import { VehiclesSearchBar } from "@/components/vehicles/vehicles-search-bar";
import { VehiclesList } from "@/components/vehicles/vehicles-list";
import type { BookingStatus, VehicleStatus } from "@prisma/client";

const PAGE_SIZE = 25;

type SearchParams = { status?: string; page?: string; q?: string };

const VALID_STATUSES = ["AVAILABLE", "RENTED", "MAINTENANCE", "UNAVAILABLE"] as const;

const statusTabs = [
  { key: undefined as VehicleStatus | undefined, label: "Tous" },
  { key: "AVAILABLE" as VehicleStatus, label: "Disponibles" },
  { key: "RENTED" as VehicleStatus, label: "Loués" },
  { key: "MAINTENANCE" as VehicleStatus, label: "Maintenance" },
  { key: "UNAVAILABLE" as VehicleStatus, label: "Désactivés" },
];

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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

  const emptyMessage = statusFilter === "AVAILABLE"
    ? "Aucun véhicule disponible"
    : statusFilter === "RENTED"
    ? "Aucun véhicule en location"
    : statusFilter === "MAINTENANCE"
    ? "Aucun véhicule en maintenance"
    : statusFilter === "UNAVAILABLE"
    ? "Aucun véhicule désactivé"
    : searchQuery
    ? `Aucun résultat pour "${searchQuery}"`
    : "Aucun véhicule enregistré";

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Véhicules
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez votre parc automobile
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/vehicles/import"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors duration-200 hover:bg-blue-100"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Importer Excel
            </Link>
            <Link
              href="/vehicles/add"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              Ajouter un véhicule
            </Link>
          </div>
        ) : null}
      </div>

      {/* ── Section 1: Status filter ── */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider sm:text-[11px]">
          Statut
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
                ? `/vehicles?status=${tab.key}`
                : "/vehicles";

            return (
              <Link
                key={tab.label}
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
          Recherche
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
            {!statusFilter && !searchQuery
              ? "Votre flotte est vide. Ajoutez votre premier véhicule."
              : emptyMessage}
          </p>
          <p className="text-gray-400 text-xs mb-5">
            {!searchQuery && !statusFilter
              ? "Ajoutez votre premier véhicule pour commencer"
              : "Essayez de modifier vos filtres"}
          </p>
          {!statusFilter && !searchQuery && (
            <Link
              href="/vehicles/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              Ajouter un véhicule
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
                baseUrl="/vehicles"
                searchParams={{ status, q }}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
