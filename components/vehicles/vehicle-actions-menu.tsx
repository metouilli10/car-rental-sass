"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Edit2, PowerOff, Trash2, Power } from "lucide-react";
import Link from "next/link";
import { deleteVehicle, deactivateVehicle } from "@/lib/actions/vehicles";
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
}

export function VehicleActionsMenu({
  vehicleId,
  vehicleStatus,
}: VehicleActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const result = await deleteVehicle(vehicleId);
      if (result?.error) {
        setError(result.error);
        setIsDeleting(false);
      }
    } catch {
      setError("Une erreur s'est produite");
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsToggling(true);
    setIsOpen(false);
    try {
      await deactivateVehicle(vehicleId);
    } finally {
      setIsToggling(false);
    }
  };

  const isDeactivated = vehicleStatus === "UNAVAILABLE";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isToggling}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50"
        aria-label="Actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 mt-1 origin-top-right animate-in fade-in zoom-in-95 duration-100">
          <Link
            href={`/vehicles/${vehicleId}/edit`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5 text-gray-400" />
            Modifier
          </Link>

          <button
            onClick={handleToggleStatus}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {isDeactivated ? (
              <>
                <Power className="h-3.5 w-3.5 text-emerald-500" />
                Réactiver
              </>
            ) : (
              <>
                <PowerOff className="h-3.5 w-3.5 text-gray-400" />
                Désactiver
              </>
            )}
          </button>

          <div className="border-t border-gray-100 my-1" />

          <button
            onClick={() => {
              setIsOpen(false);
              setShowDeleteDialog(true);
            }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer
          </button>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
