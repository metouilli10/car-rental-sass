"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Car } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getBrandLogoPath } from "@/lib/brand-logos";
import { VehicleActionsMenu } from "@/components/vehicles/vehicle-actions-menu";
import { VehicleDetailsDrawer } from "@/components/vehicles/vehicle-details-drawer";
import type { VehicleListItem } from "@/components/vehicles/types";

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

interface VehiclesListProps {
  vehicles: VehicleListItem[];
  isRentedView: boolean;
}

export function VehiclesList({ vehicles, isRentedView }: VehiclesListProps) {
  const router = useRouter();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId],
  );

  const handleEdit = (vehicleId: string) => {
    router.push(`/vehicles/${vehicleId}/edit`);
  };

  const closeDrawer = () => {
    setSelectedVehicleId(null);
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="hidden overflow-x-auto sm:block">
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
                {isRentedView ? (
                  <>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Période
                    </th>
                  </>
                ) : null}
                <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vehicles.map((vehicle) => {
                const brandLogoPath = getBrandLogoPath(vehicle.make);
                const activeBooking = vehicle.bookings?.[0];

                return (
                  <tr
                    key={vehicle.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
                          {brandLogoPath ? (
                            <div className="relative h-7 w-7">
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
                          <div className="text-sm font-semibold leading-snug text-gray-900">
                            {vehicle.make} {vehicle.model}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-400">
                            {vehicle.color}
                            {" · "}
                            {vehicle.gearbox === "AUTO" ? "Automatique" : "Manuelle"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-mono font-medium tracking-wide text-gray-700">
                        {vehicle.plate}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{vehicle.year}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(vehicle.pricePerDay)}
                      </span>
                      <span className="ml-0.5 text-xs text-gray-400">/j</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusBadgeStyles[vehicle.status] ?? "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {statusLabels[vehicle.status] ?? vehicle.status}
                      </span>
                    </td>
                    {isRentedView ? (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {activeBooking ? activeBooking.customer.name : "—"}
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
                    ) : null}
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <VehicleActionsMenu
                        vehicleId={vehicle.id}
                        vehicleStatus={vehicle.status}
                        onEdit={handleEdit}
                        onToggleActive={(id) => {
                          if (selectedVehicleId === id) closeDrawer();
                        }}
                        onSetMaintenance={(id) => {
                          if (selectedVehicleId === id) closeDrawer();
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-gray-100 sm:hidden">
          {vehicles.map((vehicle) => {
            const brandLogoPath = getBrandLogoPath(vehicle.make);
            return (
              <div
                key={vehicle.id}
                className="flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50"
                onClick={() => setSelectedVehicleId(vehicle.id)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                  {brandLogoPath ? (
                    <div className="relative h-8 w-8">
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

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        statusBadgeStyles[vehicle.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {statusLabels[vehicle.status] ?? vehicle.status}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400">{vehicle.plate}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs font-semibold text-gray-600">
                      {formatCurrency(vehicle.pricePerDay)}/j
                    </span>
                  </div>
                </div>

                <div onClick={(event) => event.stopPropagation()}>
                  <VehicleActionsMenu
                    vehicleId={vehicle.id}
                    vehicleStatus={vehicle.status}
                    onEdit={handleEdit}
                    onToggleActive={(id) => {
                      if (selectedVehicleId === id) closeDrawer();
                    }}
                    onSetMaintenance={(id) => {
                      if (selectedVehicleId === id) closeDrawer();
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <VehicleDetailsDrawer
        open={Boolean(selectedVehicle)}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
        vehicle={selectedVehicle}
      />
    </>
  );
}
