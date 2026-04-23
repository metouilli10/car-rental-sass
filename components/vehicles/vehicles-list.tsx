"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatCurrency, formatDate } from "@/lib/utils";
import { brandLogoSrc } from "@/lib/brands";
import { VehicleActionsMenu } from "@/components/vehicles/vehicle-actions-menu";
import type { VehicleListItem } from "@/components/vehicles/types";
import { useI18n } from "@/components/i18n/i18n-context";
import { withLocalePath } from "@/lib/i18n/config";
import { StatusBadge } from "@/components/shared/status-badge";

interface VehiclesListProps {
  vehicles: VehicleListItem[];
  isRentedView: boolean;
  canManageVehicles: boolean;
  canDeleteVehicles?: boolean;
  statusFilter?: string;
}

export function VehiclesList({
  vehicles,
  isRentedView,
  canManageVehicles,
  canDeleteVehicles = false,
  statusFilter,
}: VehiclesListProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [rows, setRows] = useState<VehicleListItem[]>(vehicles);

  const statusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return t("vehicles.statusAvailable");
      case "RENTED":
        return t("vehicles.statusRented");
      case "MAINTENANCE":
        return t("vehicles.statusMaintenance");
      case "UNAVAILABLE":
        return t("vehicles.statusUnavailable");
      default:
        return status;
    }
  };

  const goVehicle = (id: string) => {
    router.push(withLocalePath(locale, `/vehicles/${id}`));
  };

  useEffect(() => {
    setRows(vehicles);
  }, [vehicles]);

  const handleEdit = (vehicleId: string) => {
    router.push(withLocalePath(locale, `/vehicles/${vehicleId}/edit`));
  };

  const shouldKeepRowInCurrentView = (nextStatus: string) => {
    if (!statusFilter) return true;
    if (statusFilter === "AVAILABLE") return nextStatus === "AVAILABLE";
    if (statusFilter === "UNAVAILABLE") return nextStatus === "UNAVAILABLE";
    if (statusFilter === "MAINTENANCE") return nextStatus === "MAINTENANCE";
    if (statusFilter === "RENTED") return nextStatus === "RENTED";
    return true;
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-subtle bg-white shadow-card">
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-subtle">
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 md:px-8 md:py-5">
                  {t("vehicles.colVehicle")}
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 md:px-8 md:py-5">
                  {t("vehicles.colPlate")}
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 md:px-8 md:py-5">
                  {t("vehicles.colYear")}
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 md:px-8 md:py-5">
                  {t("vehicles.colPricePerDay")}
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 md:px-8 md:py-5">
                  {t("vehicles.colStatus")}
                </th>
                {isRentedView ? (
                  <>
                    <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 md:px-8 md:py-5">
                      {t("vehicles.colClient")}
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 md:px-8 md:py-5">
                      {t("vehicles.colPeriod")}
                    </th>
                  </>
                ) : null}
                <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 md:px-8 md:py-5">
                  {t("vehicles.colActions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((vehicle) => {
                const logoSrc = brandLogoSrc(vehicle.brandKey, vehicle.make);
                const activeBooking = vehicle.bookings?.[0];

                return (
                  <tr
                    key={vehicle.id}
                    className="cursor-pointer transition-colors hover:bg-[hsl(var(--surface-muted))] focus-within:bg-[hsl(var(--surface-muted))]"
                    onClick={() => goVehicle(vehicle.id)}
                  >
                    <td className="px-6 py-4.5 md:px-8 md:py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/[0.06]">
                          <div className="relative h-6 w-6">
                            <Image
                              src={logoSrc}
                              alt={`${vehicle.make} logo`}
                              fill
                              className="object-contain"
                              sizes="24px"
                            />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold leading-snug text-slate-950">
                            {vehicle.make} {vehicle.model}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {vehicle.color}
                            {" · "}
                            {vehicle.gearbox === "AUTO" ? t("vehicles.gearAuto") : t("vehicles.gearManual")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 md:px-8 md:py-6">
                      <span className="inline-flex items-center rounded-md border border-subtle bg-[hsl(var(--surface-muted))] px-2.5 py-0.5 text-xs font-mono font-medium tracking-wide text-slate-700">
                        {vehicle.plate}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-sm text-slate-600 md:px-8 md:py-6">{vehicle.year}</td>
                    <td className="px-6 py-4.5 md:px-8 md:py-6">
                      <span className="text-base font-semibold text-slate-950">
                        {formatCurrency(vehicle.pricePerDay)}
                      </span>
                      <span className="ml-0.5 text-xs text-muted-foreground">{t("vehicles.perDay")}</span>
                    </td>
                    <td className="px-6 py-4.5 md:px-8 md:py-6">
                      <StatusBadge status={vehicle.status as "AVAILABLE" | "RENTED" | "MAINTENANCE" | "UNAVAILABLE"} />
                    </td>
                    {isRentedView ? (
                      <>
                        <td className="px-6 py-4.5 text-sm text-slate-700 md:px-8 md:py-6">
                          {activeBooking ? activeBooking.customer.name : "—"}
                        </td>
                        <td className="px-6 py-4.5 text-xs text-muted-foreground md:px-8 md:py-6">
                          {activeBooking ? (
                            <>
                              {formatDate(activeBooking.startDate)}
                              <span className="mx-1 text-border-strong">→</span>
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
                        canManageVehicles={canManageVehicles}
                        canDeleteVehicle={canDeleteVehicles}
                        onEdit={handleEdit}
                        onToggleActive={(id, nextStatus) => {
                          if (nextStatus) {
                            setRows((prev) => {
                              const updated = prev.map((row) =>
                                row.id === id ? { ...row, status: nextStatus } : row
                              );
                              return shouldKeepRowInCurrentView(nextStatus)
                                ? updated
                                : updated.filter((row) => row.id !== id);
                            });
                          }
                        }}
                        onSetMaintenance={(id, nextStatus) => {
                          if (nextStatus) {
                            setRows((prev) => {
                              const updated = prev.map((row) =>
                                row.id === id ? { ...row, status: nextStatus } : row
                              );
                              return shouldKeepRowInCurrentView(nextStatus)
                                ? updated
                                : updated.filter((row) => row.id !== id);
                            });
                          }
                        }}
                        onDelete={(id) => {
                          setRows((prev) => prev.filter((row) => row.id !== id));
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border/60 sm:hidden">
          {rows.map((vehicle) => {
            const logoSrc = brandLogoSrc(vehicle.brandKey, vehicle.make);
            return (
              <div
                key={vehicle.id}
                className="flex cursor-pointer items-center gap-3 px-4 py-4 transition-colors hover:bg-[hsl(var(--surface-muted))]"
                onClick={() => goVehicle(vehicle.id)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary/[0.06]">
                  <div className="relative h-7 w-7">
                    <Image
                      src={logoSrc}
                      alt={`${vehicle.make} logo`}
                      fill
                      className="object-contain"
                      sizes="28px"
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 break-words text-sm font-semibold leading-snug text-slate-950">
                      {vehicle.make} {vehicle.model}
                    </span>
                    <StatusBadge status={vehicle.status as "AVAILABLE" | "RENTED" | "MAINTENANCE" | "UNAVAILABLE"} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{vehicle.plate}</span>
                    <span className="text-border-strong">·</span>
                    <span className="text-base font-semibold text-slate-950">
                      {formatCurrency(vehicle.pricePerDay)}
                    </span>
                    <span className="text-xs text-muted-foreground">{t("vehicles.perDay")}</span>
                  </div>
                </div>

                <div onClick={(event) => event.stopPropagation()}>
                    <VehicleActionsMenu
                      vehicleId={vehicle.id}
                      vehicleStatus={vehicle.status}
                      canManageVehicles={canManageVehicles}
                      canDeleteVehicle={canDeleteVehicles}
                      onEdit={handleEdit}
                    onToggleActive={(id, nextStatus) => {
                      if (nextStatus) {
                        setRows((prev) => {
                          const updated = prev.map((row) =>
                            row.id === id ? { ...row, status: nextStatus } : row
                          );
                          return shouldKeepRowInCurrentView(nextStatus)
                            ? updated
                            : updated.filter((row) => row.id !== id);
                        });
                      }
                    }}
                    onSetMaintenance={(id, nextStatus) => {
                      if (nextStatus) {
                        setRows((prev) => {
                          const updated = prev.map((row) =>
                            row.id === id ? { ...row, status: nextStatus } : row
                          );
                          return shouldKeepRowInCurrentView(nextStatus)
                            ? updated
                            : updated.filter((row) => row.id !== id);
                        });
                      }
                    }}
                    onDelete={(id) => {
                      setRows((prev) => prev.filter((row) => row.id !== id));
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
