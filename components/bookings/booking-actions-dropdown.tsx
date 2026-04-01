"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocalizedPath } from "@/components/i18n/use-localized-path";
import type { SyntheticEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { BookingStatus, BookingPaymentStatus, UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { cancelBooking, completeBooking, deleteBooking, startBooking } from "@/lib/actions/bookings";
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

interface BookingActionsDropdownProps {
  bookingId: string;
  status: BookingStatus;
  paymentStatus?: BookingPaymentStatus | null;
  role: UserRole;
}

export function BookingActionsDropdown({
  bookingId,
  status,
  paymentStatus,
  role,
}: BookingActionsDropdownProps) {
  const lp = useLocalizedPath();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const canManageDestructive = role === "OWNER" || role === "MANAGER";
  const canDeleteReservation = role === "OWNER";

  const canShowStart = status === "CONFIRMED";
  const canShowComplete = status === "ACTIVE";
  const canShowCancel = canManageDestructive && (status === "CONFIRMED" || status === "ACTIVE");
  const canShowDelete = canDeleteReservation && status !== "ACTIVE";

  const canCollectPayment = useMemo(() => {
    if (!paymentStatus) {
      return false;
    }
    return paymentStatus === "PENDING" || paymentStatus === "PARTIAL";
  }, [paymentStatus]);

  const handleServerAction = (
    action: () => Promise<void | { success: true } | { error: string }>,
    successMessage: string
  ) => {
    startTransition(async () => {
      try {
        const result = await action();
        if (result && typeof result === "object" && "error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success(successMessage);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Action impossible pour le moment");
      }
    });
  };

  const handleComingSoon = (label: string) => {
    toast.info(`${label} : Bientôt disponible`);
  };
  const stopPropagation = (event: SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Plus d'actions"
            disabled={isPending}
            onPointerDown={stopPropagation}
            onTouchStart={stopPropagation}
            onClick={stopPropagation}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link href={lp(`/bookings/${bookingId}`)}>Voir détails</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              router.push(lp(`/bookings/${bookingId}/edit`));
            }}
          >
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canCollectPayment}
            onSelect={() => handleComingSoon("Encaissement")}
          >
            Encaisser paiement
          </DropdownMenuItem>

          {(canShowStart || canShowComplete || canShowCancel || canShowDelete) && (
            <DropdownMenuSeparator />
          )}

          {canShowStart ? (
            <DropdownMenuItem
              disabled={isPending}
              onSelect={() =>
                handleServerAction(
                  () => startBooking(bookingId),
                  "Réservation passée en cours"
                )
              }
            >
              Marquer comme En cours
            </DropdownMenuItem>
          ) : null}

          {canShowComplete ? (
            <DropdownMenuItem
              disabled={isPending}
              onSelect={() =>
                handleServerAction(
                  () => completeBooking(bookingId),
                  "Réservation clôturée"
                )
              }
            >
              Clôturer (Marquer terminée)
            </DropdownMenuItem>
          ) : null}

          {canShowCancel ? (
            <DropdownMenuItem
              disabled={isPending}
              className="text-destructive focus:text-destructive"
              onSelect={() =>
                handleServerAction(
                  () => cancelBooking(bookingId),
                  "Réservation annulée"
                )
              }
            >
              Annuler
            </DropdownMenuItem>
          ) : null}

          {canShowDelete ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault();
                setConfirmDeleteOpen(true);
              }}
            >
              Supprimer
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la réservation</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La réservation sera supprimée définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                handleServerAction(async () => {
                  const result = await deleteBooking(bookingId);
                  if (result?.error) {
                    throw new Error(result.error);
                  }
                  setConfirmDeleteOpen(false);
                }, "Réservation supprimée")
              }
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
