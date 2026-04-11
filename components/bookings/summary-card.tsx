"use client";

import { AlertTriangle, CarFront, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { BookingCustomerOption, BookingVehicleOption } from "@/components/bookings/types";
import { useI18n } from "@/components/i18n/i18n-context";
import { interpolate } from "@/lib/i18n/messages";

interface SummaryCardProps {
  vehicle?: BookingVehicleOption;
  client?: BookingCustomerOption;
  durationLabel: string;
  startAt?: string;
  endAt?: string;
  baseTotal: number;
  addonsTotal: number;
  discountTotal: number;
  vatTotal: number;
  totalTTC: number;
  paid: number;
  remaining: number;
  warnings: string[];
}

export function SummaryCard({
  vehicle,
  client,
  durationLabel,
  startAt,
  endAt,
  baseTotal,
  addonsTotal,
  discountTotal,
  vatTotal,
  totalTTC,
  paid,
  remaining,
  warnings,
}: SummaryCardProps) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold">{t("reservationWizard.summary.title")}</h3>

      <div className="mt-4 space-y-3">
        <section className="rounded-xl border border-border/60 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("reservationWizard.summary.rental")}</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium">
            <CarFront className="h-4 w-4 text-blue-600" />
            {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : t("reservationWizard.summary.vehicleNotSelected")}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="h-4 w-4" />
            {client ? client.name : t("reservationWizard.summary.clientNotSelected")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {startAt ? formatDateTime(startAt) : "--"} → {endAt ? formatDateTime(endAt) : "--"}
          </p>
          <p className="mt-1 text-sm font-medium">
            {t("reservationWizard.summary.durationPrefix")} {durationLabel}
          </p>
        </section>

        <section className="rounded-xl border border-border/60 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("reservationWizard.summary.pricing")}</p>
          <div className="mt-2 space-y-1 text-sm">
            <Row label={t("reservationWizard.stepPricing.base")} value={baseTotal} />
            <Row label={t("reservationWizard.stepPricing.addons")} value={addonsTotal} />
            <Row label={t("reservationWizard.stepPricing.discount")} value={-discountTotal} />
            <Row label={t("reservationWizard.stepPricing.vat")} value={vatTotal} />
            <Separator className="my-1" />
            <Row label={t("reservationWizard.stepPricing.totalTtc")} value={totalTTC} bold />
          </div>
        </section>

        <section className="rounded-xl border border-border/60 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("reservationWizard.summary.payment")}</p>
          <div className="mt-2 space-y-1 text-sm">
            <Row label={t("reservationWizard.insights.paid")} value={paid} />
            <div className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">
              {interpolate(t("reservationWizard.summary.remainingInline"), { amount: formatCurrency(remaining) })}
            </div>
          </div>
        </section>

        {warnings.length > 0 ? (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              {t("reservationWizard.summary.warnings")}
            </p>
            <div className="flex flex-wrap gap-2">
              {warnings.map((warning, index) => (
                <Badge key={`${warning}-${index}`} variant="warning">
                  {warning}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "font-semibold text-foreground" : "font-medium"}>{formatCurrency(value)}</span>
    </div>
  );
}
