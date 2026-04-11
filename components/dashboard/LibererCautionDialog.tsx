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
import { useI18n } from "@/components/i18n/i18n-context";
import { interpolate } from "@/lib/i18n/messages";

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
  const { t } = useI18n();
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
      toast.success(t("dialogs.releaseDeposit.toastSuccess"));
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error(t("dialogs.releaseDeposit.toastError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dialogs.releaseDeposit.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {interpolate(t("dialogs.releaseDeposit.description"), {
              customerName,
              vehicleLabel,
              plate,
              amount: formatCurrency(amount),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t("dialogs.releaseDeposit.cancel")}
          </AlertDialogCancel>
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
                {t("dialogs.releaseDeposit.saving")}
              </>
            ) : (
              t("dialogs.releaseDeposit.confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
