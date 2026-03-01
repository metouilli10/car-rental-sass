"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  AlertTriangle,
  Car,
  Disc3,
  Armchair,
  Gauge,
  Fuel,
  Droplets,
} from "lucide-react";
import { SECTION_LABELS } from "@/lib/validations/damage-report";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { InspectionSections } from "../types";

/** Only vehicle-condition sections shown as OK/Damage rows */
const SUMMARY_SECTION_TYPES = ["CARROSSERIE", "PNEUS", "INTERIEUR"] as const;

const SECTION_ICONS: Record<string, React.ReactNode> = {
  CARROSSERIE: <Car className="w-5 h-5" />,
  PNEUS: <Disc3 className="w-5 h-5" />,
  INTERIEUR: <Armchair className="w-5 h-5" />,
};

interface SummaryDepositStepProps {
  sections: InspectionSections;
  inspectionType: "DEPART" | "RETOUR";
  notes: string;
  depositAction: "RELEASE" | "PARTIAL" | "HOLD";
  deductFromDeposit: boolean;
  deductedAmount: number;
  depositAmount: number | null;
  fuelLevel: string;
  cleanliness: string;
  mileage: string;
  onNotesChange: (notes: string) => void;
  onDepositActionChange: (action: "RELEASE" | "PARTIAL" | "HOLD") => void;
  onDeductFromDepositChange: (checked: boolean) => void;
  onDeductedAmountChange: (amount: number) => void;
}

export function SummaryDepositStep({
  sections,
  inspectionType,
  notes,
  depositAction,
  deductFromDeposit,
  deductedAmount,
  depositAmount,
  fuelLevel,
  cleanliness,
  mileage,
  onNotesChange,
  onDepositActionChange,
  onDeductFromDepositChange,
  onDeductedAmountChange,
}: SummaryDepositStepProps) {
  const totalDamageCost = SUMMARY_SECTION_TYPES.reduce(
    (sum, type) => {
      const s = sections[type];
      return sum + (s.status === "DAMAGE" ? s.damageCost || 0 : 0);
    },
    0
  );

  const hasDamage = SUMMARY_SECTION_TYPES.some(
    (type) => sections[type].status === "DAMAGE"
  );

  const isRetour = inspectionType === "RETOUR";

  return (
    <div className="space-y-6">
      {/* Relevés card */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Relevés
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Kilométrage</p>
                <p className="font-medium truncate">
                  {mileage ? `${Number(mileage).toLocaleString("fr-FR")} km` : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Carburant</p>
                <p className="font-medium truncate">{fuelLevel || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Propreté</p>
                <p className="font-medium truncate">{cleanliness || "—"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle condition sections summary (Carrosserie, Pneus, Intérieur only) */}
      <div>
        <h3 className="text-lg font-semibold mb-3">État du véhicule</h3>
        <div className="space-y-2">
          {SUMMARY_SECTION_TYPES.map((type) => {
            const s = sections[type];
            return (
              <div
                key={type}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  s.status === "DAMAGE"
                    ? "border-red-200 bg-red-50"
                    : "border-emerald-200 bg-emerald-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      s.status === "DAMAGE" ? "text-red-600" : "text-emerald-600"
                    }
                  >
                    {SECTION_ICONS[type]}
                  </span>
                  <span className="font-medium text-sm">
                    {SECTION_LABELS[type]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {s.status === "DAMAGE" && s.damageCost > 0 && (
                    <span className="text-sm font-medium text-red-600">
                      {formatCurrency(s.damageCost)}
                    </span>
                  )}
                  {s.status === "OK" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {totalDamageCost > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-red-100 border border-red-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-red-800">
                Coût total des dommages
              </span>
              <span className="text-lg font-bold text-red-700">
                {formatCurrency(totalDamageCost)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notes générales</Label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Notes supplémentaires sur l'inspection..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Deposit Action — only for Retour inspections */}
      {isRetour && (
        <>
          <div className="space-y-3">
            <Label>Action sur la caution</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "RELEASE" as const, label: "Libérer", color: "emerald" },
                { value: "PARTIAL" as const, label: "Partielle", color: "amber" },
                { value: "HOLD" as const, label: "Retenir", color: "red" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onDepositActionChange(opt.value)}
                  className={cn(
                    "flex items-center justify-center p-3 rounded-xl border-2 transition-all text-sm font-semibold min-h-[48px]",
                    depositAction === opt.value
                      ? opt.color === "emerald"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : opt.color === "amber"
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deduct from deposit */}
          {hasDamage && depositAmount != null && depositAmount > 0 && (
            <div className="space-y-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="deductFromDeposit"
                  checked={deductFromDeposit}
                  onCheckedChange={(checked) => {
                    onDeductFromDepositChange(!!checked);
                    if (!checked) onDeductedAmountChange(0);
                  }}
                />
                <Label
                  htmlFor="deductFromDeposit"
                  className="font-medium cursor-pointer"
                >
                  Déduire de la caution ({formatCurrency(depositAmount)})
                </Label>
              </div>
              {deductFromDeposit && (
                <div className="space-y-2 pl-7">
                  <Label htmlFor="deductedAmount">Montant à déduire (MAD)</Label>
                  <Input
                    id="deductedAmount"
                    type="number"
                    min={0}
                    max={depositAmount}
                    step={50}
                    value={deductedAmount || ""}
                    onChange={(e) =>
                      onDeductedAmountChange(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    className="h-12 text-lg"
                  />
                  {deductedAmount > depositAmount && (
                    <p className="text-xs text-red-500">
                      Le montant ne peut pas dépasser la caution (
                      {formatCurrency(depositAmount)})
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
