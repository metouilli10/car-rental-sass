"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  startBooking,
  completeBooking,
  cancelBooking,
  extendActiveBooking,
} from "@/lib/actions/bookings";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  endDate?: Date;
  pricePerDay?: number;
}

export function BookingStatusActions({
  bookingId,
  currentStatus,
  canCancel,
  endDate,
  pricePerDay,
}: BookingStatusActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [additionalDays, setAdditionalDays] = useState(1);

  const handleAction = async (
    action: () => Promise<void | { success: true } | { error: string }>,
    successMessage: string
  ) => {
    setIsLoading(true);
    try {
      const result = await action();
      if (result && typeof result === "object" && "error" in result) {
        toast.error(result.error);
        return;
      }
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
    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
      {currentStatus === "CONFIRMED" && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="h-9 w-full sm:w-auto" disabled={isLoading}>
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
                <Button variant="destructive" size="sm" className="h-9 w-full sm:w-auto" disabled={isLoading}>
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
              <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto" disabled={isLoading}>
                Prolonger la réservation
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Prolonger la réservation</AlertDialogTitle>
                <AlertDialogDescription>
                  Ajoutez des jours à cette location active. Un paiement en attente sera
                  créé automatiquement pour le montant supplémentaire.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Jours à ajouter</label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={additionalDays}
                    onChange={(event) =>
                      setAdditionalDays(
                        Math.max(1, Math.min(30, Number(event.target.value) || 1))
                      )
                    }
                  />
                </div>

                {typeof pricePerDay === "number" ? (
                  <p className="text-sm text-muted-foreground">
                    Supplément estimé :{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(additionalDays * pricePerDay)}
                    </span>
                  </p>
                ) : null}

                {endDate ? (
                  <p className="text-sm text-muted-foreground">
                    Nouveau retour prévu :{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(
                        new Date(
                          new Date(endDate).setDate(
                            new Date(endDate).getDate() + additionalDays
                          )
                        )
                      )}
                    </span>
                  </p>
                ) : null}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    handleAction(async () => {
                      await extendActiveBooking(bookingId, additionalDays);
                    }, "Réservation prolongée avec succès")
                  }
                  disabled={isLoading}
                >
                  Prolonger
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="h-9 w-full sm:w-auto" disabled={isLoading}>
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
                  Le véhicule sera marqué comme disponible. Assurez-vous d&apos;avoir
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
