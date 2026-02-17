"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingFormData } from "@/lib/validations/booking";
import { formatCurrency } from "@/lib/utils";

interface PaymentSectionProps {
  paymentType: BookingFormData["paymentType"];
  onPaymentTypeChange: (value: BookingFormData["paymentType"]) => void;
  status: BookingFormData["status"];
  onStatusChange: (value: BookingFormData["status"]) => void;
  paidNow: number;
  onPaidNowChange: (value: number) => void;
  remaining: number;
  notes?: string;
  onNotesChange: (value: string) => void;
  isSubmitting: boolean;
  onSaveDraft: () => void;
}

export function PaymentSection({
  paymentType,
  onPaymentTypeChange,
  status,
  onStatusChange,
  paidNow,
  onPaidNowChange,
  remaining,
  notes,
  onNotesChange,
  isSubmitting,
  onSaveDraft,
}: PaymentSectionProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="paymentType">Mode de paiement</Label>
          <Select value={paymentType} onValueChange={(value) => onPaymentTypeChange(value as BookingFormData["paymentType"])}>
            <SelectTrigger id="paymentType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Espèces</SelectItem>
              <SelectItem value="TRANSFER">Virement</SelectItem>
              <SelectItem value="CARD">Carte</SelectItem>
              <SelectItem value="OTHER">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select value={status} onValueChange={(value) => onStatusChange(value as BookingFormData["status"])}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONFIRMED">Confirmée</SelectItem>
              <SelectItem value="DRAFT">En attente</SelectItem>
              <SelectItem value="ACTIVE">Réservée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="paidNow">Montant payé الآن (MAD)</Label>
          <Input
            id="paidNow"
            type="number"
            min={0}
            step="0.01"
            value={paidNow}
            onChange={(event) => onPaidNowChange(Number(event.target.value) || 0)}
          />
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Reste à payer</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(remaining)}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder="Informations complémentaires..."
          value={notes ?? ""}
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? "Création..." : "Créer la réservation"}
        </Button>
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onSaveDraft}>
          Enregistrer brouillon
        </Button>
      </div>
    </div>
  );
}
