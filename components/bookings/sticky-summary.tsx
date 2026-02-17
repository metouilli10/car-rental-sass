"use client";

import { AlertTriangle, CarFront, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { BookingCustomerOption, BookingVehicleOption, PricingDerived } from "@/components/bookings/types";

interface StickySummaryProps {
  vehicle?: BookingVehicleOption;
  customer?: BookingCustomerOption;
  startDate?: string;
  endDate?: string;
  durationText: string;
  pricing: PricingDerived;
  depositAmount: number;
  paidNow: number;
  warnings: string[];
}

export function StickySummary({
  vehicle,
  customer,
  startDate,
  endDate,
  durationText,
  pricing,
  depositAmount,
  paidNow,
  warnings,
}: StickySummaryProps) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-sm lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle>Résumé</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-xl border border-border/70 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Location</p>
          <div className="space-y-1">
            <p className="flex items-center gap-2 font-medium">
              <CarFront className="h-4 w-4 text-blue-600" />
              {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : "Véhicule non sélectionné"}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <UserRound className="h-4 w-4" />
              {customer ? `${customer.name} • ${customer.phone}` : "Client non sélectionné"}
            </p>
            <p className="text-muted-foreground">
              {startDate ? formatDateTime(startDate) : "--"} → {endDate ? formatDateTime(endDate) : "--"}
            </p>
            <p className="font-medium">Durée: {durationText}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Tarification</p>
          <div className="space-y-1">
            <SummaryRow label="Base" value={pricing.basePrice} />
            <SummaryRow label="Add-ons" value={pricing.addonsTotal} />
            <SummaryRow label="Remise" value={-pricing.discountAmount} />
            <SummaryRow label="Caution" value={depositAmount} />
            <SummaryRow label="Total HT" value={pricing.totalHt} />
            <SummaryRow label="TVA" value={pricing.totalTva} />
            <SummaryRow label="Total TTC" value={pricing.totalTtc} strong />
            <SummaryRow label="Payé الآن" value={paidNow} />
            <SummaryRow label="Restant" value={pricing.remaining} strong />
          </div>
        </div>

        {warnings.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide">
              <AlertTriangle className="h-4 w-4" />
              Alertes
            </p>
            <ul className="space-y-1 text-sm">
              {warnings.map((warning, idx) => (
                <li key={`${warning}-${idx}`}>• {warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "font-semibold text-foreground" : "font-medium"}>{formatCurrency(value)}</span>
    </div>
  );
}
