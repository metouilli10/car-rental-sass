"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Edit2, PowerOff, Power, Loader2, Wrench, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deactivateVehicle, deleteVehicle, setVehicleMaintenance } from "@/lib/actions/vehicles";
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

interface VehicleActionsMenuProps {
  vehicleId: string;
  vehicleStatus: string;
  canManageVehicles?: boolean;
  canDeleteVehicle?: boolean;
  onEdit: (vehicleId: string) => void;
  onToggleActive?: (vehicleId: string, nextStatus?: string) => void;
  onSetMaintenance?: (vehicleId: string, nextStatus?: string) => void;
  onDelete?: (vehicleId: string) => void;
}

export function VehicleActionsMenu({
  vehicleId,
  vehicleStatus,
  canManageVehicles = true,
  canDeleteVehicle = false,
  onEdit,
  onToggleActive,
  onSetMaintenance,
  onDelete,
}: VehicleActionsMenuProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isSettingMaintenance, setIsSettingMaintenance] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      const result = await deactivateVehicle(vehicleId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        isActive ? "Véhicule désactivé" : "Véhicule activé",
      );
      onToggleActive?.(vehicleId, result?.status);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setIsToggling(false);
    }
  };

  const handleSetMaintenance = async () => {
    setIsSettingMaintenance(true);
    try {
      const result = await setVehicleMaintenance(vehicleId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Véhicule mis en maintenance");
      onSetMaintenance?.(vehicleId, result?.status);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du passage en maintenance");
    } finally {
      setIsSettingMaintenance(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteVehicle(vehicleId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Véhicule supprimé");
      setConfirmDeleteOpen(false);
      onDelete?.(vehicleId);
      startTransition(() => {
        router.push("/vehicles");
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression du véhicule");
    } finally {
      setIsDeleting(false);
    }
  };

  const isActive = vehicleStatus === "AVAILABLE";
  const isInMaintenance = vehicleStatus === "MAINTENANCE";
  const isBusy = isToggling || isSettingMaintenance || isDeleting;

  if (!canManageVehicles) {
    return null;
  }

  return (
    <>
      <div onClick={(event) => event.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-800"
              disabled={isBusy}
              aria-label="Actions"
              onClick={(event) => event.stopPropagation()}
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                onEdit(vehicleId);
              }}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                void handleToggleStatus();
              }}
            >
              {isActive ? (
                <PowerOff className="mr-2 h-4 w-4" />
              ) : (
                <Power className="mr-2 h-4 w-4 text-emerald-600" />
              )}
              {isActive ? "Désactiver" : "Activer"}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isBusy || isInMaintenance}
              onClick={(event) => {
                event.stopPropagation();
                void handleSetMaintenance();
              }}
            >
              <Wrench className="mr-2 h-4 w-4" />
              Mettre en maintenance
            </DropdownMenuItem>
            {canDeleteVehicle ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(event) => {
                  event.stopPropagation();
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
    </>
  );
}
