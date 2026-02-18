import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { Pagination } from "@/components/shared/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Plus, Car } from "lucide-react";
import { VehicleActionsMenu } from "@/components/vehicles/vehicle-actions-menu";
import { VehiclesSearchBar } from "@/components/vehicles/vehicles-search-bar";
import { getBrandLogoPath } from "@/lib/brand-logos";
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

const statusBadgeStyles: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  RENTED: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  MAINTENANCE: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  UNAVAILABLE: "bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200",
};

const statusLabels: Record<string, string> = {
  AVAILABLE: "Disponible",
  RENTED: "Loué",
  MAINTENANCE: "Maintenance",
  UNAVAILABLE: "Désactivé",
};

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) return null;

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
      include:
        statusFilter === "RENTED"
          ? {
              bookings: {
                where: { status: "ACTIVE" },
                take: 1,
                select: {
                  startDate: true,
                  endDate: true,
                  customer: { select: { id: true, name: true } },
                },
              },
            }
          : undefined,
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
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">

          {/* ── Desktop table ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Plaque
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Année
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Prix / Jour
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  {isRentedView && (
                    <>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Période
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vehicles.map((vehicle) => {
                  const brandLogoPath = getBrandLogoPath(vehicle.make);
                  const activeBooking =
                    "bookings" in vehicle
                      ? (
                          vehicle.bookings as Array<{
                            startDate: Date;
                            endDate: Date;
                            customer: { id: string; name: string };
                          }>
                        )?.[0]
                      : null;

                  return (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-gray-50/70 transition-colors duration-150"
                    >
                      {/* Vehicle column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                            {brandLogoPath ? (
                              <div className="relative w-7 h-7">
                                <Image
                                  src={brandLogoPath}
                                  alt={`Logo ${vehicle.make}`}
                                  fill
                                  className="object-contain"
                                  sizes="28px"
                                />
                              </div>
                            ) : (
                              <Car className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm leading-snug">
                              {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {vehicle.color}
                              {" · "}
                              {vehicle.gearbox === "AUTO"
                                ? "Automatique"
                                : "Manuelle"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plate */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-xs font-mono font-medium text-gray-700 tracking-wide">
                          {vehicle.plate}
                        </span>
                      </td>

                      {/* Year */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {vehicle.year}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(vehicle.pricePerDay)}
                        </span>
                        <span className="text-xs text-gray-400 ml-0.5">/j</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            statusBadgeStyles[vehicle.status] ??
                            "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {statusLabels[vehicle.status] ?? vehicle.status}
                        </span>
                      </td>

                      {/* Rented-view extras */}
                      {isRentedView && (
                        <>
                          <td className="px-6 py-4 text-sm">
                            {activeBooking ? (
                              <Link
                                href={`/customers/${activeBooking.customer.id}`}
                                className="text-[#6D5EF7] hover:underline font-medium"
                              >
                                {activeBooking.customer.name}
                              </Link>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {activeBooking ? (
                              <>
                                {formatDate(activeBooking.startDate)}
                                <span className="mx-1 text-gray-300">→</span>
                                {formatDate(activeBooking.endDate)}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <VehicleActionsMenu
                          vehicleId={vehicle.id}
                          vehicleStatus={vehicle.status}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="sm:hidden divide-y divide-gray-100">
            {vehicles.map((vehicle) => {
              const brandLogoPath = getBrandLogoPath(vehicle.make);
              return (
                <div
                  key={vehicle.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    {brandLogoPath ? (
                      <div className="relative w-8 h-8">
                        <Image
                          src={brandLogoPath}
                          alt={`Logo ${vehicle.make}`}
                          fill
                          className="object-contain"
                          sizes="32px"
                        />
                      </div>
                    ) : (
                      <Car className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {vehicle.make} {vehicle.model}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                          statusBadgeStyles[vehicle.status] ??
                          "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {statusLabels[vehicle.status] ?? vehicle.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 font-mono">
                        {vehicle.plate}
                      </span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs font-semibold text-gray-600">
                        {formatCurrency(vehicle.pricePerDay)}/j
                      </span>
                    </div>
                  </div>

                  <VehicleActionsMenu
                    vehicleId={vehicle.id}
                    vehicleStatus={vehicle.status}
                  />
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/vehicles"
                searchParams={{ status, q }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
