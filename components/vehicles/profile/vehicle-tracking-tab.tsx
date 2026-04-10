import type { ReactNode } from "react";
import Link from "next/link";
import { ClipboardCheck, Gauge, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/lib/i18n/config";
import { withLocalePath } from "@/lib/i18n/config";
import { formatDate } from "@/lib/utils";
import type { VehicleProfileData } from "@/lib/vehicles/profile";
import { getHealthBadgeClass } from "./presentation";
import { VehicleInspectionHistory } from "./vehicle-inspection-history";
import { VehicleInfractionsPanel } from "./vehicle-infractions-panel";
import { VehicleRemindersPanel } from "./vehicle-reminders-panel";

interface VehicleTrackingTabProps {
  data: VehicleProfileData;
  currentOrNextBookingId: string | null;
  inspectionLabel: string | null;
  locale?: AppLocale;
}

export function VehicleTrackingTab({
  data,
  currentOrNextBookingId,
  inspectionLabel,
  locale = "fr",
}: VehicleTrackingTabProps) {
  return (
    <div className="space-y-6">
      <Card className="rounded-[24px] border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">État véhicule</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryMetric
              icon={<Wrench className="h-4 w-4" />}
              label="Prochaine vidange"
              value={
                data.reminders.nextOilChange.expiryDate
                  ? formatDate(data.reminders.nextOilChange.expiryDate)
                  : data.reminders.nextOilChange.reference ?? "À planifier"
              }
              badgeLabel={data.reminders.nextOilChange.statusLabel}
              badgeClass={getHealthBadgeClass(data.reminders.nextOilChange.status)}
            />
            <SummaryMetric
              icon={<Gauge className="h-4 w-4" />}
              label="Kilométrage actuel"
              value={
                data.vehicle.currentKm != null
                  ? `${data.vehicle.currentKm.toLocaleString("fr-FR")} km`
                  : "Non renseigné"
              }
            />
            <SummaryMetric
              icon={<ClipboardCheck className="h-4 w-4" />}
              label="Dernière inspection"
              value={
                data.workspace.lastInspection
                  ? formatDate(data.workspace.lastInspection.reportedAt)
                  : "Aucune inspection"
              }
            />
          </div>

          <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Notes d’entretien
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {data.vehicle.maintenanceNotes?.trim() || "Aucune note d’entretien active."}
                </p>
              </div>
              {currentOrNextBookingId ? (
                <Button size="sm" asChild>
                  <Link href={withLocalePath(locale, `/damage-reports/new?bookingId=${currentOrNextBookingId}`)}>
                    Lancer une inspection
                  </Link>
                </Button>
              ) : (
                <Button size="sm" disabled title={inspectionLabel ?? undefined}>
                  Lancer une inspection
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
        <VehicleInspectionHistory
          inspections={data.inspections}
          locale={locale}
          createInspectionHref={
            currentOrNextBookingId
              ? withLocalePath(locale, `/damage-reports/new?bookingId=${currentOrNextBookingId}`)
              : undefined
          }
          createInspectionDisabledReason={inspectionLabel}
        />

        <div className="space-y-6">
          <VehicleRemindersPanel
            vehicleId={data.vehicle.id}
            overdue={data.reminders.overdue}
            open={data.reminders.open}
            done={data.reminders.done}
            locale={locale}
          />
          <VehicleInfractionsPanel
            vehicleId={data.vehicle.id}
            infractions={data.infractions}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({
  icon,
  label,
  value,
  badgeLabel,
  badgeClass,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  badgeLabel?: string;
  badgeClass?: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200/80 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-4 text-base font-semibold text-slate-950">{value}</p>
      {badgeLabel && badgeClass ? (
        <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
          {badgeLabel}
        </span>
      ) : null}
    </div>
  );
}
