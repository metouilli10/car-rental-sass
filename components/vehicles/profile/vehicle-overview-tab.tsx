import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { VehicleProfileData } from "@/lib/vehicles/profile";
import { bookingStatusLabels, getHealthBadgeClass } from "./presentation";
import { VehicleCompliancePanel } from "./vehicle-compliance-panel";
import { VehicleInfractionsPanel } from "./vehicle-infractions-panel";
import { VehicleRemindersPanel } from "./vehicle-reminders-panel";

export function VehicleOverviewTab({ data }: { data: VehicleProfileData }) {
  const reservation = data.currentReservation ?? data.nextReservation;
  const latestInspection = data.latestInspection;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
      <div className="space-y-6">
        <Card className="rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informations véhicule</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <InfoRow label="Marque" value={data.vehicle.make} />
            <InfoRow label="Modèle" value={data.vehicle.model} />
            <InfoRow label="Plaque" value={data.vehicle.plate} />
            <InfoRow label="Année" value={`${data.vehicle.year}`} />
            <InfoRow label="Couleur" value={data.vehicle.color} />
            <InfoRow label="Transmission" value={data.vehicle.gearbox === "AUTO" ? "Automatique" : "Manuelle"} />
            <InfoRow label="Carburant" value={formatFuelType(data.vehicle.fuelType)} />
            <InfoRow label="Kilométrage" value={data.vehicle.currentKm != null ? `${data.vehicle.currentKm.toLocaleString("fr-FR")} km` : "—"} />
            <InfoRow label="Prix / jour" value={formatCurrency(data.vehicle.pricePerDay)} />
            <InfoRow label="Caution" value={formatCurrency(data.vehicle.depositAmount)} />
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-slate-400">Statut</p>
              <StatusBadge status={data.vehicle.status} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Réservation en cours / prochaine</CardTitle>
            {reservation ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/bookings/${reservation.id}`}>Ouvrir</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {reservation ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Client" value={reservation.customerName} />
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Statut réservation</p>
                  <span className="text-sm font-medium text-slate-900">{bookingStatusLabels[reservation.status]}</span>
                </div>
                <InfoRow label="Dates" value={`${formatDate(reservation.startDate)} → ${formatDate(reservation.endDate)}`} />
                <InfoRow label="Agence / retour" value={`${reservation.pickupLocation ?? "Agence"} · ${reservation.returnLocation ?? "Agence"}`} />
              </div>
            ) : (
              <EmptyCardMessage message="Aucune réservation active ou future pour ce véhicule." />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Dernière inspection</CardTitle>
              {latestInspection ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/damage-reports/${latestInspection.id}`}>Ouvrir</Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {latestInspection ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <ClipboardCheck className="h-4 w-4 text-blue-600" />
                    Inspection {latestInspection.inspectionType === "DEPART" ? "départ" : "retour"}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow label="Date" value={formatDate(latestInspection.reportedAt)} />
                    <InfoRow label="Client" value={latestInspection.customerName} />
                    <InfoRow label="Carburant" value={latestInspection.fuelLevel ?? "—"} />
                    <InfoRow label="Dommages" value={`${latestInspection.damageCount}`} />
                  </div>
                </div>
              ) : (
                <EmptyCardMessage message="Aucune inspection enregistrée." />
              )}
            </CardContent>
          </Card>

          <VehicleRemindersPanel
            vehicleId={data.vehicle.id}
            overdue={data.reminders.overdue}
            open={data.reminders.open}
            done={data.reminders.done}
            compact
          />
        </div>
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conformité véhicule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.compliance.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.expiryDate ? `Échéance ${formatDate(item.expiryDate)}` : item.helperText}
                  </p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getHealthBadgeClass(item.status)}`}>
                  {item.statusLabel}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <VehicleCompliancePanel vehicleId={data.vehicle.id} items={data.compliance} compact />
        <VehicleInfractionsPanel vehicleId={data.vehicle.id} infractions={data.infractions} compact />
      </div>
    </div>
  );
}

function formatFuelType(fuelType: VehicleProfileData["vehicle"]["fuelType"]) {
  switch (fuelType) {
    case "DIESEL":
      return "Diesel";
    case "HYBRID":
      return "Hybride";
    case "ELECTRIC":
      return "Électrique";
    default:
      return "Essence";
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function EmptyCardMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
