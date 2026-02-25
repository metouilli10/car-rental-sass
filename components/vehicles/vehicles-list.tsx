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
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  RENTED: "bg-blue-100 text-blue-700",
  MAINTENANCE: "bg-amber-100 text-amber-700",
  UNAVAILABLE: "bg-gray-100 text-gray-600",
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
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 md:px-8 md:py-5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="px-6 py-4 md:px-8 md:py-5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Plaque
                </th>
                <th className="px-6 py-4 md:px-8 md:py-5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Année
                </th>
                <th className="px-6 py-4 md:px-8 md:py-5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Prix / Jour
                </th>
                <th className="px-6 py-4 md:px-8 md:py-5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                {isRentedView ? (
                  <>
                    <th className="px-6 py-4 md:px-8 md:py-5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 md:px-8 md:py-5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Période
                    </th>
                  </>
                ) : null}
                <th className="px-6 py-4 md:px-8 md:py-5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
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
                    className="cursor-pointer transition-colors hover:bg-blue-50/40"
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                  >
                    <td className="px-6 py-4.5 md:px-8 md:py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-100">
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
                            <Car className="h-4 w-4 text-blue-600/80" />
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
                    <td className="px-6 py-4.5 md:px-8 md:py-6">
                      <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-mono font-medium tracking-wide text-gray-700">
                        {vehicle.plate}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 md:px-8 md:py-6 text-sm text-gray-600">{vehicle.year}</td>
                    <td className="px-6 py-4.5 md:px-8 md:py-6">
                      <span className="text-base font-semibold text-blue-600">
                        {formatCurrency(vehicle.pricePerDay)}
                      </span>
                      <span className="ml-0.5 text-xs text-muted-foreground">/j</span>
                    </td>
                    <td className="px-6 py-4.5 md:px-8 md:py-6">
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
                        <td className="px-6 py-4.5 md:px-8 md:py-6 text-sm text-gray-700">
                          {activeBooking ? activeBooking.customer.name : "—"}
                        </td>
                        <td className="px-6 py-4.5 md:px-8 md:py-6 text-xs text-gray-500">
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
                      className="px-6 py-4.5 md:px-8 md:py-6 text-right"
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

        <div className="divide-y divide-border sm:hidden">
          {vehicles.map((vehicle) => {
            const brandLogoPath = getBrandLogoPath(vehicle.make);
            return (
              <div
                key={vehicle.id}
                className="flex cursor-pointer items-center gap-3 px-4 py-4 transition-colors hover:bg-blue-50/40"
                onClick={() => setSelectedVehicleId(vehicle.id)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-100">
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
                    <Car className="h-5 w-5 text-blue-600/80" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        statusBadgeStyles[vehicle.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {statusLabels[vehicle.status] ?? vehicle.status}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400">{vehicle.plate}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-base font-semibold text-blue-600">
                      {formatCurrency(vehicle.pricePerDay)}
                    </span>
                    <span className="text-xs text-muted-foreground">/j</span>
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
