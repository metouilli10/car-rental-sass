"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingFormData } from "@/lib/validations/booking";
import { formatCurrency } from "@/lib/utils";
import type { PricingDerived } from "@/components/bookings/types";

type AddonItem = BookingFormData["addons"][number];

interface PricingEditorProps {
  pricePerDay: number;
  onPricePerDayChange: (value: number) => void;
  discountType: BookingFormData["discountType"];
  onDiscountTypeChange: (value: BookingFormData["discountType"]) => void;
  discountValue: number;
  onDiscountValueChange: (value: number) => void;
  depositAmount: number;
  onDepositAmountChange: (value: number) => void;
  taxEnabled: boolean;
  onTaxEnabledChange: (value: boolean) => void;
  taxRate: number;
  onTaxRateChange: (value: number) => void;
  addons: AddonItem[];
  onAddAddon: () => void;
  onRemoveAddon: (index: number) => void;
  onUpdateAddon: (index: number, key: keyof AddonItem, value: string | number | boolean) => void;
  derived: PricingDerived;
}

export function PricingEditor({
  pricePerDay,
  onPricePerDayChange,
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  depositAmount,
  onDepositAmountChange,
  taxEnabled,
  onTaxEnabledChange,
  taxRate,
  onTaxRateChange,
  addons,
  onAddAddon,
  onRemoveAddon,
  onUpdateAddon,
  derived,
}: PricingEditorProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pricePerDay">Prix / jour (MAD)</Label>
          <Input
            id="pricePerDay"
            type="number"
            min={0}
            step="0.01"
            value={pricePerDay}
            onChange={(event) => onPricePerDayChange(Number(event.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depositAmount">Caution (MAD)</Label>
          <Input
            id="depositAmount"
            type="number"
            min={0}
            step="0.01"
            value={depositAmount}
            onChange={(event) => onDepositAmountChange(Number(event.target.value) || 0)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-medium">Add-ons</p>
          <Button type="button" size="sm" variant="outline" onClick={onAddAddon}>
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        </div>
        <div className="space-y-3">
          {addons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun add-on ajouté.</p>
          ) : null}
          {addons.map((addon, index) => (
            <div key={`addon-${index}`} className="grid gap-2 rounded-lg border border-border/60 p-3 md:grid-cols-12">
              <Input
                className="md:col-span-5"
                placeholder="Libellé (GPS, siège bébé...)"
                value={addon.label}
                onChange={(event) => onUpdateAddon(index, "label", event.target.value)}
              />
              <Input
                className="md:col-span-2"
                type="number"
                min={1}
                value={addon.quantity}
                onChange={(event) => onUpdateAddon(index, "quantity", Number(event.target.value) || 1)}
              />
              <Input
                className="md:col-span-3"
                type="number"
                min={0}
                step="0.01"
                value={addon.unitAmount}
                onChange={(event) => onUpdateAddon(index, "unitAmount", Number(event.target.value) || 0)}
              />
              <Button
                type="button"
                variant="ghost"
                className="md:col-span-2"
                onClick={() => onRemoveAddon(index)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Retirer
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="discountType">Remise</Label>
          <Select
            value={discountType ?? "none"}
            onValueChange={(value) =>
              onDiscountTypeChange(value === "none" ? null : (value as BookingFormData["discountType"]))
            }
          >
            <SelectTrigger id="discountType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune remise</SelectItem>
              <SelectItem value="PERCENTAGE">Pourcentage (%)</SelectItem>
              <SelectItem value="FIXED">Montant fixe (MAD)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountValue">Valeur remise</Label>
          <Input
            id="discountValue"
            type="number"
            min={0}
            step="0.01"
            value={discountValue}
            onChange={(event) => onDiscountValueChange(Number(event.target.value) || 0)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-medium">TVA</p>
          <Button
            type="button"
            variant={taxEnabled ? "default" : "outline"}
            size="sm"
            className={taxEnabled ? "bg-blue-600 hover:bg-blue-700" : ""}
            onClick={() => onTaxEnabledChange(!taxEnabled)}
          >
            {taxEnabled ? "Activée" : "Désactivée"}
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRate">Taux TVA (%)</Label>
          <Input
            id="taxRate"
            type="number"
            min={0}
            step="0.01"
            value={taxRate}
            disabled={!taxEnabled}
            onChange={(event) => onTaxRateChange(Number(event.target.value) || 0)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm">
        <p className="mb-2 font-medium text-blue-900">Aperçu tarification</p>
        <div className="space-y-1 text-blue-800">
          <p>Base: {formatCurrency(derived.basePrice)}</p>
          <p>Add-ons: {formatCurrency(derived.addonsTotal)}</p>
          <p>Remise: -{formatCurrency(derived.discountAmount)}</p>
          <p>HT: {formatCurrency(derived.totalHt)}</p>
          <p>TVA: {formatCurrency(derived.totalTva)}</p>
          <p className="font-semibold">TTC: {formatCurrency(derived.totalTtc)}</p>
        </div>
      </div>
    </div>
  );
}
