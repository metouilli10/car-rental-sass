"use client";

import { useState } from "react";
import Link from "next/link";
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
  MoreHorizontal,
  Pencil,
  CreditCard,
  Banknote,
  FileText,
  XCircle,
} from "lucide-react";
import { BookingStatusActions } from "@/components/bookings/booking-status-actions";
import { BookingLifecycleStepper } from "@/components/reservations/BookingLifecycleStepper";
import { LibererCautionDialog } from "@/components/dashboard/LibererCautionDialog";
import { EncaisserDialog } from "@/components/dashboard/EncaisserDialog";
import {
  formatDateFR,
  getReservationTone,
  type ReservationToneVariant,
} from "@/lib/reservations/presentation";
import { cancelBooking } from "@/lib/actions/bookings";
import { toast } from "sonner";
import type { BookingStatus } from "@prisma/client";

type Vehicle = { make: string; model: string; plate?: string };
type Customer = { name: string };

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
  endDateForExtend?: Date;
  pricePerDay?: number;
  /** When present and status is HELD, "Restituer caution" opens in-place release dialog. */
  deposit?: { id: string; amount: number; status: string } | null;
  /** Outstanding amount for "Ajouter paiement" dialog default. */
  remainingAmount?: number;
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
  endDateForExtend,
  pricePerDay,
  deposit,
  remainingAmount = 0,
}: ReservationDetailsHeaderProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [libererCautionOpen, setLibererCautionOpen] = useState(false);
  const [encaisserOpen, setEncaisserOpen] = useState(false);

  const { label: statusLabel, variant: statusVariant } = getReservationTone(status);
  const startStr = formatDateFR(startDate);
  const endStr = formatDateFR(endDate);
  const vehicleName = `${vehicle.make} ${vehicle.model}`;
  const subline = `${startStr} → ${endStr} • ${durationDays} jour(s) • ${vehicleName} • ${customer.name}`;
  const canReleaseInPlace = deposit?.status === "HELD" && deposit?.id;

  const handleCancel = async () => {
    setIsCanceling(true);
    try {
      await cancelBooking(bookingId);
      toast.success("Réservation annulée");
      setCancelDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'annulation");
    } finally {
      setIsCanceling(false);
    }
  };

  const isCanceled = status === "CANCELED";

  return (
    <header className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badgeVariantMap[statusVariant] ?? "secondary"}>
              {statusLabel}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Réservation #{code}
          </h1>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isCanceled && status !== "COMPLETED" && (
            <div className="flex items-center gap-2">
              <BookingStatusActions
                bookingId={bookingId}
                currentStatus={status}
                canCancel={false}
                endDate={endDateForExtend}
                pricePerDay={pricePerDay}
              />
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Actions réservation">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/bookings/${bookingId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setEncaisserOpen(true);
                }}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Ajouter paiement
              </DropdownMenuItem>
              {canReleaseInPlace ? (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setLibererCautionOpen(true);
                  }}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Restituer caution
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/finance?tab=cautions">
                    <Banknote className="mr-2 h-4 w-4" />
                    Restituer caution
                  </Link>
                </DropdownMenuItem>
              )}
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <BookingLifecycleStepper status={status} />

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

      <EncaisserDialog
        open={encaisserOpen}
        onOpenChange={setEncaisserOpen}
        bookingId={bookingId}
        defaultAmount={remainingAmount}
        customerName={customer.name}
        vehicleLabel={vehicleName}
      />

      {canReleaseInPlace && deposit && (
        <LibererCautionDialog
          open={libererCautionOpen}
          onOpenChange={setLibererCautionOpen}
          depositId={deposit.id}
          customerName={customer.name}
          vehicleLabel={vehicleName}
          plate={vehicle.plate ?? ""}
          amount={deposit.amount}
        />
      )}
    </header>
  );
}
