import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, FileText, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { VehicleComplianceItem, VehicleProfileData } from "@/lib/vehicles/profile";
import {
  bookingStatusLabels,
  formatFuelType,
  getActivityToneClass,
  getHealthBadgeClass,
  getWorkspaceToneClass,
} from "./presentation";
import { VehicleInfractionsPanel } from "./vehicle-infractions-panel";
import { VehicleRemindersPanel } from "./vehicle-reminders-panel";

interface VehicleOverviewTabProps {
  data: VehicleProfileData;
  currentOrNextBookingId: string | null;
  inspectionLabel: string | null;
}

export function VehicleOverviewTab({
  data,
  currentOrNextBookingId,
  inspectionLabel,
}: VehicleOverviewTabProps) {
  const bookingFocus = data.currentReservation ?? data.workspace.nextBooking;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-[30px] border border-slate-200/60 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),rgba(248,250,252,0.96)_45%,rgba(241,245,249,0.92))] shadow-[0_20px_50px_rgba(15,23,42,0.09)]">
          <CardHeader className="pb-6">
            <div className="space-y-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Disponibilité</p>
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-[2.5rem]">
                  {data.workspace.vehicleAvailabilityStatus.label}
                </CardTitle>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium shadow-sm ${getWorkspaceToneClass(
                    data.workspace.vehicleAvailabilityStatus.tone,
                  )}`}
                >
                  {data.workspace.canGoOutToday.label}
                </span>
              </div>
              <p className="max-w-2xl text-base text-slate-700">{data.workspace.vehicleAvailabilityStatus.detail}</p>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">{data.workspace.canGoOutToday.helperText}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border-t border-slate-200/80 pt-6">
              <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
                <DefinitionItem
                  label="Réservation en cours / prochaine"
                  value={bookingFocus ? bookingFocus.customerName : "Aucune réservation"}
                  helper={bookingFocus ? `${formatDate(bookingFocus.startDate)} au ${formatDate(bookingFocus.endDate)}` : undefined}
                />
                <DefinitionItem
                  label="Dernière inspection"
                  value={
                    data.workspace.lastInspection
                      ? formatDate(data.workspace.lastInspection.reportedAt)
                      : "Aucune inspection"
                  }
                />
                <DefinitionItem
                  label="Kilométrage actuel"
                  value={
                    data.vehicle.currentKm != null
                      ? `${data.vehicle.currentKm.toLocaleString("fr-FR")} km`
                      : "Non renseigné"
                  }
                />
                <DefinitionItem
                  label="Transmission / carburant"
                  value={`${data.vehicle.gearbox === "AUTO" ? "Automatique" : "Manuelle"} · ${formatFuelType(
                    data.vehicle.fuelType,
                  )}`}
                />
              </dl>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
            <CardTitle className="text-base">Réservation en cours / prochaine</CardTitle>
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/bookings/create?vehicleId=${data.vehicle.id}`}>
                Nouvelle réservation
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {bookingFocus ? (
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{bookingFocus.customerName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(bookingFocus.startDate)} au {formatDate(bookingFocus.endDate)}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DefinitionItem label="Statut réservation" value={bookingStatusLabels[bookingFocus.status]} />
                    <DefinitionItem
                      label="Agence / retour"
                      value={`${bookingFocus.pickupLocation ?? "Agence"} · ${bookingFocus.returnLocation ?? "Agence"}`}
                    />
                  </div>
                </div>

                <div className="flex items-start justify-end">
                  <Button variant="outline" asChild>
                    <Link href={`/bookings/${bookingFocus.id}`}>
                      Ouvrir
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <ActionEmptyState
                title="Aucune réservation à venir"
                description="Le véhicule n’a aucune réservation active ou planifiée."
                ctaLabel="Créer une réservation"
                href={`/bookings/create?vehicleId=${data.vehicle.id}`}
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Dernière inspection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {data.workspace.lastInspection ? (
              <div className="flex flex-wrap items-start justify-between gap-4 rounded-[20px] bg-slate-50/70 px-4 py-4">
                <div>
                  <p className="text-lg font-semibold text-slate-950">
                    Inspection {data.workspace.lastInspection.inspectionType === "DEPART" ? "départ" : "retour"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {data.workspace.lastInspection.customerName} · {formatDateTime(data.workspace.lastInspection.reportedAt)}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/damage-reports/${data.workspace.lastInspection.id}`}>
                    Ouvrir
                  </Link>
                </Button>
              </div>
            ) : (
              <ActionEmptyState
                title="Aucune inspection enregistrée"
                description="Lancez une inspection pour sécuriser le prochain départ ou retour."
                ctaLabel="Lancer une inspection"
                href={
                  currentOrNextBookingId
                    ? `/damage-reports/new?bookingId=${currentOrNextBookingId}`
                    : undefined
                }
                disabledReason={inspectionLabel ?? "Une réservation active ou à venir est nécessaire."}
              />
            )}

            {data.activity.length > 0 ? (
              <div className="border-t border-slate-100 pt-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Activité récente</p>
                <div className="mt-4 space-y-3">
                  {data.activity.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${getActivityToneClass(item.tone)}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{item.title}</p>
                          <span className="text-xs text-slate-400">{formatDateTime(item.timestamp)}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="mt-1 inline-flex text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Ouvrir
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <VehicleRemindersPanel
          vehicleId={data.vehicle.id}
          overdue={data.reminders.overdue}
          open={data.reminders.open}
          done={data.reminders.done}
        />

        <VehicleInfractionsPanel
          vehicleId={data.vehicle.id}
          infractions={data.infractions}
          compact
        />
      </div>

      <div className="space-y-6">
        <Card className="rounded-[24px] border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <CardHeader className="pb-4">
            <div className="space-y-3">
              <CardTitle className="text-base">Conformité & risques</CardTitle>
              <p className="text-sm text-slate-600">{data.workspace.complianceSummary.summaryText}</p>
              <div className="flex flex-wrap gap-2">
                <SummaryPill tone={data.workspace.complianceSummary.blockedCount > 0 ? "danger" : "neutral"}>
                  {data.workspace.complianceSummary.blockedCount} bloquant{data.workspace.complianceSummary.blockedCount > 1 ? "s" : ""}
                </SummaryPill>
                <SummaryPill tone={data.workspace.complianceSummary.warningCount > 0 ? "warning" : "neutral"}>
                  {data.workspace.complianceSummary.warningCount} à surveiller
                </SummaryPill>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.compliance.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-start justify-between gap-3 py-3 ${
                    index === 0 ? "" : "border-t border-slate-100"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-950">{item.label}</p>
                    {getComplianceRowHelper(item) ? (
                      <p className="mt-1 text-sm text-slate-500">{getComplianceRowHelper(item)}</p>
                    ) : null}
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getHealthBadgeClass(item.status)}`}>
                    {item.statusLabel}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.compliance.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 py-3 ${
                    index === 0 ? "" : "border-t border-slate-100"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-950">{item.label}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        <FileText className="h-3.5 w-3.5" />
                        {item.fileUrl ? "Uploadé" : "Manquant"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.fileUrl ? "Document disponible" : "Ajoutez le document pour compléter le dossier."}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${getHealthBadgeClass(item.status)}`}>
                      {item.statusLabel}
                    </span>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/vehicles/${data.vehicle.id}?tab=documents`}>
                        {item.fileUrl ? "Remplacer" : "Ajouter"}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Données commerciales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CommercialMetric
              icon={<Wallet className="h-4 w-4" />}
              label="Prix / jour"
              value={formatCurrency(data.vehicle.pricePerDay)}
            />
            <CommercialMetric
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Caution"
              value={formatCurrency(data.vehicle.depositAmount)}
            />
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Rentabilité</p>
              <p className="mt-2 text-sm text-slate-600">Emplacement prêt pour le revenu et la marge par véhicule.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DefinitionItem({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
      {helper ? <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p> : null}
    </div>
  );
}

function CommercialMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-slate-50/80 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-3 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ActionEmptyState({
  title,
  description,
  ctaLabel,
  href,
  disabledReason,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  disabledReason?: string;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/70">
          <ClipboardCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          {href ? (
            <Button variant="secondary" size="sm" className="mt-4" asChild>
              <Link href={href}>{ctaLabel}</Link>
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="mt-4" disabled title={disabledReason}>
              {ctaLabel}
            </Button>
          )}
          {!href && disabledReason ? <p className="mt-2 text-xs text-slate-400">{disabledReason}</p> : null}
        </div>
      </div>
    </div>
  );
}

function SummaryPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "danger" | "warning" | "neutral";
}) {
  const toneClass =
    tone === "danger"
      ? "bg-red-50 text-red-700"
      : tone === "warning"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-600";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>{children}</span>;
}

function getComplianceRowHelper(item: VehicleComplianceItem) {
  if (item.status === "ok") {
    return null;
  }

  if (item.expiryDate) {
    return `Échéance ${formatDate(item.expiryDate)}`;
  }

  return item.helperText;
}
