"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  ChevronDown,
  Pencil,
  FileText,
  XCircle,
  CalendarClock,
  CarFront,
  User2,
  Trash2,
} from "lucide-react";
import { BookingStatusActions } from "@/components/bookings/booking-status-actions";
import {
  formatDateFR,
  getReservationTone,
  type ReservationToneVariant,
} from "@/lib/reservations/presentation";
import { cancelBooking, deleteBooking } from "@/lib/actions/bookings";
import { toast } from "sonner";
import type { BookingStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";

type Vehicle = { id: string; make: string; model: string; plate?: string };
type Customer = { id: string; name: string };

export interface ReservationDetailsHeaderProps {
  bookingId: string;
  code: string;
  status: BookingStatus;
  startDate: Date | string;
  endDate: Date | string;
  durationDays: number;
  vehicle: Vehicle;
  customer: Customer;
  canCancel: boolean;
  canDelete: boolean;
  endDateForExtend?: Date;
  pricePerDay?: number;
}

const badgeVariantMap: Record<
  ReservationToneVariant,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
> = {
  default: "default",
  secondary: "secondary",
  success: "success",
  warning: "warning",
  destructive: "destructive",
  info: "info",
};

export function ReservationDetailsHeader({
  bookingId,
  code,
  status,
  startDate,
  endDate,
  durationDays,
  vehicle,
  customer,
  canCancel,
  canDelete,
  endDateForExtend,
  pricePerDay,
}: ReservationDetailsHeaderProps) {
  const router = useRouter();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { label: statusLabel, variant: statusVariant } = getReservationTone(status);
  const startStr = formatDateFR(startDate);
  const endStr = formatDateFR(endDate);
  const vehicleName = `${vehicle.make} ${vehicle.model}`;
  const subline = `${startStr} → ${endStr} • ${durationDays} jour(s)`;

  const handleCancel = async () => {
    setIsCanceling(true);
    try {
      const result = await cancelBooking(bookingId);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Réservation annulée");
      setCancelDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'annulation");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteBooking(bookingId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Réservation supprimée");
      setDeleteDialogOpen(false);
      router.push("/bookings");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const isCanceled = status === "CANCELED";
  const canDeleteThisReservation = canDelete && status !== "ACTIVE";

  return (
    <header>
      <Card className="shadow-card">
        <CardContent className="px-card-padding pb-card-padding pt-[1.15rem]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={badgeVariantMap[statusVariant] ?? "secondary"}>
                  {statusLabel}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Réservation #{code}
                </h1>
                <p className="text-sm text-muted-foreground">{subline}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5 text-sm text-muted-foreground">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-muted/25 px-3 py-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span className="truncate">{startStr} → {endStr}</span>
                </span>
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-muted/25 px-3 py-1.5">
                  <CarFront className="h-3.5 w-3.5" />
                  <span className="truncate">{vehicleName}</span>
                </span>
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-muted/25 px-3 py-1.5">
                  <User2 className="h-3.5 w-3.5" />
                  <span className="truncate">{customer.name}</span>
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto xl:max-w-[48%] xl:self-center xl:justify-end">
              {!isCanceled && status !== "COMPLETED" ? (
                <BookingStatusActions
                  bookingId={bookingId}
                  currentStatus={status}
                  canCancel={false}
                  endDate={endDateForExtend}
                  pricePerDay={pricePerDay}
                />
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-full justify-center gap-2 sm:w-auto"
                    aria-label="Plus d'actions"
                  >
                    Plus d&apos;actions
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/bookings/${bookingId}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/bookings/${bookingId}/invoice`} aria-label="Générer facture">
                      <FileText className="mr-2 h-4 w-4" />
                      Générer facture
                    </Link>
                  </DropdownMenuItem>
                  {canCancel && !isCanceled && status !== "COMPLETED" && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => {
                        e.preventDefault();
                        setCancelDialogOpen(true);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Annuler
                    </DropdownMenuItem>
                  )}
                  {canDeleteThisReservation ? (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => {
                        e.preventDefault();
                        setDeleteDialogOpen(true);
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
        </CardContent>
      </Card>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la réservation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler cette réservation ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCanceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Annuler la réservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la réservation</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La réservation sera supprimée définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Retour</AlertDialogCancel>
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
    </header>
  );
}
