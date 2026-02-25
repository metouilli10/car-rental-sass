import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { reconcilePastDueBookings } from "@/lib/actions/bookings";
import { Pagination } from "@/components/shared/pagination";
import Link from "next/link";
import { Plus, Car } from "lucide-react";
import { VehiclesSearchBar } from "@/components/vehicles/vehicles-search-bar";
import { VehiclesList } from "@/components/vehicles/vehicles-list";
import type { VehicleStatus } from "@prisma/client";

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
  const session = await getSession();
  if (!session) return null;

  await reconcilePastDueBookings();

  const { status, page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const statusFilter =
    status && (VALID_STATUSES as readonly string[]).includes(status)
      ? (status as VehicleStatus)
      : undefined;

  const searchQuery = q?.trim() || undefined;

  const baseWhere = { agencyId: session.user.agencyId };

  const where = {
    ...baseWhere,
    ...(statusFilter ? { status: statusFilter } : {}),
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

  const [vehicles, total, statusCounts] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        bookings: {
          where: { status: "ACTIVE" },
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
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const isRentedView = statusFilter === "RENTED";

  const countMap: Record<string, number> = {};
  let totalCount = 0;
  for (const item of statusCounts) {
    countMap[item.status] = item._count.status;
    totalCount += item._count.status;
  }

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
        <Link
          href="/vehicles/add"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6D5EF7] hover:bg-[#5b4fd4] text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          Ajouter un véhicule
        </Link>
      </div>

      {/* ── Status tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit overflow-x-auto">
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? "bg-[#6D5EF7] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-white/70"
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center rounded-full text-[10px] font-bold min-w-[18px] h-[18px] px-1 tabular-nums ${
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── Search + filter row ── */}
      <VehiclesSearchBar defaultValue={searchQuery} statusFilter={status} />

      {/* ── Content ── */}
      {vehicles.length === 0 && page === 1 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white shadow-sm border border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
            <Car className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-gray-700 text-sm font-medium mb-1">
            {emptyMessage}
          </p>
          <p className="text-gray-400 text-xs mb-5">
            {!searchQuery && !statusFilter
              ? "Ajoutez votre premier véhicule pour commencer"
              : "Essayez de modifier vos filtres"}
          </p>
          {!statusFilter && !searchQuery && (
            <Link
              href="/vehicles/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#6D5EF7] hover:bg-[#5b4fd4] text-white text-sm font-medium rounded-xl transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              Ajouter un véhicule
            </Link>
          )}
        </div>
      ) : (
        <>
          <VehiclesList vehicles={vehicles} isRentedView={isRentedView} />
          {totalPages > 1 ? (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
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
