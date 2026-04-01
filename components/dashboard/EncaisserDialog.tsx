"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordPaymentReceivedByBooking } from "@/lib/actions/payments";
import { formatCurrency } from "@/lib/utils";
import { paymentMethodLabel } from "@/components/finance/constants";
import type { PaymentType } from "@prisma/client";
import { useI18n } from "@/components/i18n/i18n-context";
import { interpolate } from "@/lib/i18n/messages";

interface EncaisserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  defaultAmount: number;
  customerName: string;
  vehicleLabel: string;
  onSuccess?: () => void;
}

export function EncaisserDialog({
  open,
  onOpenChange,
  bookingId,
  defaultAmount,
  customerName,
  vehicleLabel,
  onSuccess,
}: EncaisserDialogProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next && !isLoading) {
      setError(null);
      setAmount(defaultAmount.toString());
      setPaymentType("CASH");
    }
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const value = parseFloat(amount.replace(",", "."));
      if (!Number.isFinite(value) || value <= 0) {
        setError(t("dialogs.encaisser.invalidAmount"));
        setIsLoading(false);
        return;
      }
      const result = await recordPaymentReceivedByBooking(bookingId, value, paymentType);
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      handleOpenChange(false);
      router.refresh();
      onSuccess?.();
    } catch {
      setError(t("dialogs.encaisser.genericError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialogs.encaisser.title")}</DialogTitle>
          <DialogDescription>
            {interpolate(t("dialogs.encaisser.description"), {
              customerName,
              vehicleLabel,
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="encaisser-amount">{t("dialogs.encaisser.amountLabel")}</Label>
            <Input
              id="encaisser-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("dialogs.encaisser.paymentMode")}</Label>
            <Select
              value={paymentType}
              onValueChange={(v) => setPaymentType(v as PaymentType)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(paymentMethodLabel) as [PaymentType, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-md">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
              {t("dialogs.encaisser.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t("dialogs.encaisser.saving")}
                </>
              ) : (
                <>
                  {interpolate(t("dialogs.encaisser.submitWithAmount"), {
                    amount: formatCurrency(parseFloat(amount) || defaultAmount),
                  })}
                  <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
