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
        setError("Montant invalide");
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
      setError("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Encaisser le paiement</DialogTitle>
          <DialogDescription>
            {customerName} – {vehicleLabel}. Confirmez le montant et le mode de paiement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="encaisser-amount">Montant reçu (MAD)</Label>
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
            <Label>Mode de paiement</Label>
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
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  Encaisser {formatCurrency(parseFloat(amount) || defaultAmount)}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
