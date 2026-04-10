"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarPlus,
  CarFront,
  ChevronDown,
  ClipboardCheck,
  FilePenLine,
  ShieldAlert,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { brandLogoSrc } from "@/lib/brands";
import { deleteVehicle } from "@/lib/actions/vehicles";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { useLocalizedPath } from "@/components/i18n/use-localized-path";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatFuelType } from "./presentation";

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
  const lp = useLocalizedPath();
  const router = useRouter();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const logoSrc = brandLogoSrc(vehicle.brandKey, vehicle.make);
  const reminderHref = lp(`/vehicles/${vehicle.id}?tab=tracking&sheet=1`);

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
      router.push(lp("/vehicles"));
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression du véhicule");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="xl:sticky xl:top-4 xl:z-20">
      <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)] backdrop-blur md:p-6">
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

            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {vehicle.make} {vehicle.model}
                </h1>
                <StatusBadge status={vehicle.status} />
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-sm text-slate-700">
                  {vehicle.plate}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <span>{vehicle.year}</span>
                <span>{vehicle.color}</span>
                <span>{vehicle.gearbox === "AUTO" ? "Automatique" : "Manuelle"}</span>
                <span>{formatFuelType(vehicle.fuelType)}</span>
                <span>
                  {vehicle.currentKm != null
                    ? `${vehicle.currentKm.toLocaleString("fr-FR")} km`
                    : "Kilométrage non renseigné"}
                </span>
              </div>

              <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-slate-50/80 px-4 py-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    Prix / jour
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(vehicle.pricePerDay)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end xl:max-w-[520px]">
            <Button asChild className="sm:min-w-[190px]">
              <Link href={lp(`/bookings/create?vehicleId=${vehicle.id}`)}>
                <CalendarPlus className="h-4 w-4" />
                Nouvelle réservation
              </Link>
            </Button>

            {currentOrNextBookingId ? (
              <>
                <Button variant="secondary" asChild>
                  <Link href={lp(`/damage-reports/new?bookingId=${currentOrNextBookingId}`)}>
                    <ClipboardCheck className="h-4 w-4" />
                    Inspection départ
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href={lp(`/damage-reports/new?bookingId=${currentOrNextBookingId}`)}>
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
                  <DropdownMenuItem onSelect={() => router.push(lp(`/vehicles/${vehicle.id}/edit`))}>
                    <FilePenLine className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onSelect={() => router.push(reminderHref)}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Ajouter rappel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push(lp(`/infractions/new?vehicleId=${vehicle.id}`))}>
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
          <div className="mt-5 rounded-[18px] border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            {inspectionLabel}
          </div>
        ) : null}
      </div>

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
