"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Edit2, PowerOff, Power, Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { deactivateVehicle, setVehicleMaintenance } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VehicleActionsMenuProps {
  vehicleId: string;
  vehicleStatus: string;
  onEdit: (vehicleId: string) => void;
  onToggleActive?: (vehicleId: string) => void;
  onSetMaintenance?: (vehicleId: string) => void;
}

export function VehicleActionsMenu({
  vehicleId,
  vehicleStatus,
  onEdit,
  onToggleActive,
  onSetMaintenance,
}: VehicleActionsMenuProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isSettingMaintenance, setIsSettingMaintenance] = useState(false);

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
      onToggleActive?.(vehicleId);
      router.refresh();
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
      onSetMaintenance?.(vehicleId);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du passage en maintenance");
    } finally {
      setIsSettingMaintenance(false);
    }
  };

  const isActive = vehicleStatus === "AVAILABLE";
  const isInMaintenance = vehicleStatus === "MAINTENANCE";
  const isBusy = isToggling || isSettingMaintenance;

  return (
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
