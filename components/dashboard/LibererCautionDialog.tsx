"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { updateDepositStatus } from "@/lib/actions/payments";
import { formatCurrency } from "@/lib/utils";

interface LibererCautionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositId: string;
  customerName: string;
  vehicleLabel: string;
  plate: string;
  amount: number;
  onSuccess?: () => void;
}

export function LibererCautionDialog({
  open,
  onOpenChange,
  depositId,
  customerName,
  vehicleLabel,
  plate,
  amount,
  onSuccess,
}: LibererCautionDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const result = await updateDepositStatus(depositId, "RETURNED");
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Caution libérée");
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Erreur lors de la libération de la caution");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la libération de caution</AlertDialogTitle>
          <AlertDialogDescription>
            La caution de{" "}
            <span className="font-medium text-foreground">{customerName}</span> pour{" "}
            <span className="font-medium text-foreground">{vehicleLabel}</span> (
            <span className="font-mono text-foreground">{plate}</span>) –{" "}
            {formatCurrency(amount)} – sera marquée comme restituée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Confirmer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
