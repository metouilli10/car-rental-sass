import Link from "next/link";
import { AlertTriangle, CalendarClock, Gauge, ShieldCheck, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { VehicleProfileData } from "@/lib/vehicles/profile";
import { getHealthBadgeClass } from "./presentation";

export function VehicleSummaryCards({ data }: { data: VehicleProfileData }) {
  const openInfractions = data.infractions.filter((item) => item.status !== "PAID");

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
            <span className="rounded-full bg-blue-50 p-1.5 text-blue-600">
              <CalendarClock className="h-3.5 w-3.5" />
            </span>
            Réservation active / prochaine
          </div>
          {data.currentReservation ?? data.nextReservation ? (
            <>
              <p className="text-sm font-semibold text-slate-900">
                {(data.currentReservation ?? data.nextReservation)?.customerName}
              </p>
              <p className="text-sm text-slate-500">
                {formatDate((data.currentReservation ?? data.nextReservation)!.startDate)} →{" "}
                {formatDate((data.currentReservation ?? data.nextReservation)!.endDate)}
              </p>
              <Link href={`/bookings/${(data.currentReservation ?? data.nextReservation)!.id}`} className="inline-flex text-xs font-medium text-blue-600 hover:text-blue-700">
                Ouvrir la réservation
              </Link>
            </>
          ) : (
            <p className="text-sm text-slate-500">Aucune réservation à venir.</p>
          )}
        </CardContent>
      </Card>

      <CompactMetric
        icon={<ShieldCheck className="h-4 w-4" />}
        label="Assurance"
        value={data.vehicle.insuranceExpiryDate ? formatDate(data.vehicle.insuranceExpiryDate) : "À renseigner"}
        badgeClass={getHealthBadgeClass(data.compliance[0].status)}
        badgeLabel={data.compliance[0].statusLabel}
      />
      <CompactMetric
        icon={<Gauge className="h-4 w-4" />}
        label="Kilométrage"
        value={data.vehicle.currentKm != null ? `${data.vehicle.currentKm.toLocaleString("fr-FR")} km` : "Non renseigné"}
      />
      <CompactMetric
        icon={<Wrench className="h-4 w-4" />}
        label="Vidange"
        value={data.reminders.nextOilChange.expiryDate ? formatDate(data.reminders.nextOilChange.expiryDate) : data.reminders.nextOilChange.reference ?? "À planifier"}
        badgeClass={getHealthBadgeClass(data.reminders.nextOilChange.status)}
        badgeLabel={data.reminders.nextOilChange.statusLabel}
      />
      <CompactMetric
        icon={<AlertTriangle className="h-4 w-4" />}
        label="Infractions ouvertes"
        value={`${openInfractions.length}`}
        badgeClass={openInfractions.length > 0 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}
        badgeLabel={openInfractions.length > 0 ? "À traiter" : "RAS"}
        alert={openInfractions.length > 0}
      />
    </div>
  );
}

function CompactMetric({
  icon,
  label,
  value,
  badgeClass,
  badgeLabel,
  alert = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badgeClass?: string;
  badgeLabel?: string;
  alert?: boolean;
}) {
  return (
    <Card className={`rounded-2xl border-slate-200/80 bg-white shadow-sm ${alert ? "border-red-200/90 bg-red-50/40" : ""}`}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
          <span className={`rounded-full p-1.5 ${alert ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"}`}>{icon}</span>
          {label}
        </div>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
        {badgeClass && badgeLabel ? (
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
            {badgeLabel}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
