"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarPlus, CarFront, ChevronDown, ClipboardCheck, FilePenLine, ShieldAlert, Wrench, Trash2 } from "lucide-react";
import { brandLogoSrc } from "@/lib/brands";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";
import { deleteVehicle } from "@/lib/actions/vehicles";
import { toast } from "sonner";

interface VehicleProfileHeaderProps {
  vehicle: {
    id: string;
    make: string;
    model: string;
    brandKey: string;
    year: number;
    plate: string;
    color: string;
    gearbox: "AUTO" | "MANUAL";
    fuelType: "DIESEL" | "ESSENCE" | "HYBRID" | "ELECTRIC";
    status: "AVAILABLE" | "RENTED" | "MAINTENANCE" | "UNAVAILABLE";
    pricePerDay: number;
    currentKm: number | null;
    photoUrl: string | null;
  };
  currentOrNextBookingId: string | null;
  inspectionLabel: string | null;
  canManageVehicle: boolean;
  canDeleteVehicle?: boolean;
}

export function VehicleProfileHeader({
  vehicle,
  currentOrNextBookingId,
  inspectionLabel,
  canManageVehicle,
  canDeleteVehicle = false,
}: VehicleProfileHeaderProps) {
  const router = useRouter();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const logoSrc = brandLogoSrc(vehicle.brandKey);
  const reminderHref = `/vehicles/${vehicle.id}?tab=maintenance&sheet=1`;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteVehicle(vehicle.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Véhicule supprimé");
      setConfirmDeleteOpen(false);
      router.push("/vehicles");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression du véhicule");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-slate-50 ring-1 ring-slate-200/70">
            {vehicle.photoUrl ? (
              <Image
                src={vehicle.photoUrl}
                alt={`${vehicle.make} ${vehicle.model}`}
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="relative h-12 w-12">
                <Image src={logoSrc} alt={`${vehicle.make} logo`} fill className="object-contain" sizes="48px" />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {vehicle.make} {vehicle.model}
              </h1>
              <StatusBadge status={vehicle.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-slate-700">
                {vehicle.plate}
              </span>
              <span>{vehicle.year}</span>
              <span className="text-slate-300">•</span>
              <span>{vehicle.color}</span>
              <span className="text-slate-300">•</span>
              <span>{vehicle.gearbox === "AUTO" ? "Automatique" : "Manuelle"}</span>
              <span className="text-slate-300">•</span>
              <span>{formatFuelType(vehicle.fuelType)}</span>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Prix / jour</p>
                <p className="text-xl font-semibold text-blue-600">{formatCurrency(vehicle.pricePerDay)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Kilométrage actuel</p>
                <p className="text-base font-medium text-slate-900">
                  {vehicle.currentKm != null ? `${vehicle.currentKm.toLocaleString("fr-FR")} km` : "Non renseigné"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end xl:max-w-[480px]">
          <Button asChild className="sm:min-w-[180px]">
            <Link href={`/bookings/create?vehicleId=${vehicle.id}`}>
              <CalendarPlus className="h-4 w-4" />
              Nouvelle réservation
            </Link>
          </Button>

          {currentOrNextBookingId ? (
            <>
              <Button variant="secondary" asChild>
                <Link href={`/damage-reports/new?bookingId=${currentOrNextBookingId}`}>
                  <ClipboardCheck className="h-4 w-4" />
                  Inspection départ
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href={`/damage-reports/new?bookingId=${currentOrNextBookingId}`}>
                  <CarFront className="h-4 w-4" />
                  Inspection retour
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" disabled title={inspectionLabel ?? undefined}>
                <ClipboardCheck className="h-4 w-4" />
                Inspection départ
              </Button>
              <Button variant="secondary" disabled title={inspectionLabel ?? undefined}>
                <CarFront className="h-4 w-4" />
                Inspection retour
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Plus d’actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              {canManageVehicle ? (
                <DropdownMenuItem onSelect={() => router.push(`/vehicles/${vehicle.id}/edit`)}>
                  <FilePenLine className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => router.push(reminderHref)}>
                <Wrench className="mr-2 h-4 w-4" />
                Ajouter rappel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push(`/infractions/new?vehicleId=${vehicle.id}`)}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                Ajouter infraction
              </DropdownMenuItem>
              {canDeleteVehicle ? (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(event) => {
                    event.preventDefault();
                    setConfirmDeleteOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {!currentOrNextBookingId && inspectionLabel ? (
        <p className="mt-4 text-sm text-slate-500">{inspectionLabel}</p>
      ) : null}

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le véhicule</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le véhicule sera supprimé définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatFuelType(fuelType: VehicleProfileHeaderProps["vehicle"]["fuelType"]) {
  switch (fuelType) {
    case "DIESEL":
      return "Diesel";
    case "HYBRID":
      return "Hybride";
    case "ELECTRIC":
      return "Électrique";
    default:
      return "Essence";
  }
}
