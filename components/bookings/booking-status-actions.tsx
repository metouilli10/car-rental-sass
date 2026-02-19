"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  startBooking,
  completeBooking,
  cancelBooking,
} from "@/lib/actions/bookings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BookingStatusActionsProps {
  bookingId: string;
  currentStatus: string;
  canCancel: boolean;
}

export function BookingStatusActions({
  bookingId,
  currentStatus,
  canCancel,
}: BookingStatusActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: () => Promise<void>, successMessage: string) => {
    setIsLoading(true);
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStatus === "COMPLETED") {
    return (
      <div className="text-sm text-muted-foreground">
        Cette réservation est terminée.
      </div>
    );
  }

  if (currentStatus === "CANCELED") {
    return (
      <div className="text-sm text-muted-foreground">
        Cette réservation a été annulée.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {currentStatus === "CONFIRMED" && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Démarrer la location
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Démarrer la location</AlertDialogTitle>
                <AlertDialogDescription>
                  Le véhicule sera marqué comme loué et la réservation passera en
                  statut ACTIF.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleAction(() => startBooking(bookingId), "Location démarrée avec succès")}
                  disabled={isLoading}
                >
                  Confirmer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {canCancel ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isLoading}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler la réservation
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuler la réservation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir annuler cette réservation ?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLoading}>Retour</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleAction(() => cancelBooking(bookingId), "Réservation annulée")}
                    disabled={isLoading}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Annuler la réservation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </>
      )}

      {currentStatus === "ACTIVE" && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Terminer la location
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Terminer la location</AlertDialogTitle>
                <AlertDialogDescription>
                  Le véhicule sera marqué comme disponible. Assurez-vous d'avoir
                  créé un rapport de dégâts si nécessaire.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleAction(() => completeBooking(bookingId), "Location terminée avec succès")}
                  disabled={isLoading}
                >
                  Confirmer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
