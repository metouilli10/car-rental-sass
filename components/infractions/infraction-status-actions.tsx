"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  updateInfractionStatus,
  deleteInfraction,
} from "@/lib/actions/infractions";
import type { InfractionStatus } from "@prisma/client";
import {
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Loader2,
} from "lucide-react";
import { useLocalizedPath } from "@/components/i18n/use-localized-path";

interface InfractionStatusActionsProps {
  infractionId: string;
  currentStatus: InfractionStatus;
  canDeleteInfraction: boolean;
}

export function InfractionStatusActions({
  infractionId,
  currentStatus,
  canDeleteInfraction,
}: InfractionStatusActionsProps) {
  const lp = useLocalizedPath();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleStatusUpdate = (newStatus: InfractionStatus, label: string) => {
    setActiveAction(newStatus);
    startTransition(async () => {
      const result = await updateInfractionStatus(infractionId, newStatus);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Infraction ${label.toLowerCase()}`);
      }
      setActiveAction(null);
    });
  };

  const handleDelete = () => {
    setActiveAction("DELETE");
    startTransition(async () => {
      const result = await deleteInfraction(infractionId);
      if ("error" in result && result.error) {
        toast.error(result.error);
        setActiveAction(null);
      } else {
        toast.success("Infraction supprimée");
        router.push(lp("/infractions"));
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Mark as PAID */}
      {(currentStatus === "ASSIGNED" || currentStatus === "CONTESTED") && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleStatusUpdate("PAID", "Marquée payée")}
          className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          {activeAction === "PAID" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Marquer payée
        </Button>
      )}

      {/* Mark as CONTESTED */}
      {(currentStatus === "PENDING" || currentStatus === "ASSIGNED") && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleStatusUpdate("CONTESTED", "Marquée contestée")}
          className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
        >
          {activeAction === "CONTESTED" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
          Contester
        </Button>
      )}

      {/* Delete */}
      {canDeleteInfraction && currentStatus !== "PAID" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
            >
              {activeAction === "DELETE" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer l&apos;infraction ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. L&apos;infraction sera
                définitivement supprimée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
