"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarClock, CircleDollarSign, Gauge, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";
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

interface VehicleDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleListItem | null;
}

export function VehicleDetailsDrawer({
  open,
  onOpenChange,
  vehicle,
}: VehicleDetailsDrawerProps) {
  const router = useRouter();

  const activeBooking = useMemo(() => vehicle?.bookings?.[0], [vehicle]);

  if (!vehicle) {
    return null;
  }

  const statusLabel = statusLabels[vehicle.status] ?? vehicle.status;
  const statusClass =
    statusBadgeStyles[vehicle.status] ?? "bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200";

  const renderPrimaryCta = () => {
    if (vehicle.status === "AVAILABLE") {
      return (
        <Button
          className="w-full"
          onClick={() => {
            router.push(`/reservations/new?vehicleId=${vehicle.id}`);
            onOpenChange(false);
          }}
        >
          Nouvelle réservation
        </Button>
      );
    }

    if (vehicle.status === "RENTED") {
      const href = activeBooking?.id ? `/bookings/${activeBooking.id}` : "/bookings";
      return (
        <Button asChild className="w-full" variant="default">
          <Link href={href}>Voir réservation en cours</Link>
        </Button>
      );
    }

    if (vehicle.status === "MAINTENANCE") {
      return (
        <div className="space-y-2">
          <Button className="w-full" disabled>
            Réservation indisponible
          </Button>
          <p className="text-xs text-muted-foreground">
            Ce véhicule est en maintenance. Réactivez-le pour reprendre les réservations.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Button className="w-full" disabled>
          Véhicule désactivé
        </Button>
        <p className="text-xs text-muted-foreground">
          Réactivez le véhicule depuis le menu d'actions pour créer une réservation.
        </p>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="space-y-3">
          <SheetTitle className="text-xl">
            {vehicle.make} {vehicle.model}
          </SheetTitle>
          <SheetDescription className="space-y-2">
            <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-mono text-muted-foreground">
              {vehicle.plate}
            </span>
            <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {renderPrimaryCta()}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Prix / jour</p>
              <p className="mt-1 text-sm font-semibold">{formatCurrency(vehicle.pricePerDay)}</p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Année</p>
              <p className="mt-1 text-sm font-semibold">{vehicle.year}</p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Transmission</p>
              <p className="mt-1 text-sm font-semibold">
                {vehicle.gearbox === "AUTO" ? "Automatique" : "Manuelle"}
              </p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Couleur</p>
              <p className="mt-1 text-sm font-semibold">{vehicle.color}</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vue opérationnelle
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <CircleDollarSign className="h-4 w-4" />
                  Rentabilité journalière
                </span>
                <span className="font-medium">{formatCurrency(vehicle.pricePerDay)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Gauge className="h-4 w-4" />
                  Disponibilité
                </span>
                <span className="font-medium">{statusLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  Réservation active
                </span>
                <span className="font-medium">{activeBooking ? "En cours" : "Aucune"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Wrench className="h-4 w-4" />
                  État technique
                </span>
                <span className="font-medium">
                  {vehicle.status === "MAINTENANCE" ? "Intervention requise" : "Opérationnel"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
