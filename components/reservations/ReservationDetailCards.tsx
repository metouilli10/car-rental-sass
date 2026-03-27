import type { ComponentType } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CarFront,
  Check,
  ClipboardCheck,
  Clock3,
  Gauge,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn, formatCurrency, formatDateTime, formatPhoneForCall } from "@/lib/utils";
import { formatDateFR } from "@/lib/reservations/presentation";
import type { BookingStatus, Gearbox, VehicleStatus } from "@prisma/client";
import type {
  ReservationActivityItem,
  ReservationAttentionAlert,
  ReservationCustomerHistorySummary,
} from "@/lib/reservations/details";

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((segment) => segment[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function getStepIndex(status: BookingStatus) {
  if (status === "CONFIRMED") return 0;
  if (status === "ACTIVE") return 1;
  if (status === "COMPLETED") return 2;
  return -1;
}

function InfoPair({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
  href?: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </p>
      {href ? (
        <Link href={href} className="mt-1 block text-sm font-medium text-foreground transition-colors hover:text-primary">
          {value}
        </Link>
      ) : (
        <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      )}
    </div>
  );
}

export function ReservationProgressCard({
  status,
  createdAt,
}: {
  status: BookingStatus;
  createdAt: Date;
}) {
  if (status === "CANCELED") {
    return (
      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-base">Statut & progression</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Créée le {formatDateFR(createdAt)}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-destructive">Réservation annulée</p>
              <p className="text-sm text-muted-foreground">
                Le cycle de location a été interrompu avant sa clôture.
              </p>
            </div>
            <Badge variant="destructive">Annulée</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentIndex = getStepIndex(status);
  const steps = ["Confirmée", "En cours", "Terminée"];

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-base">Statut & progression</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">Créée le {formatDateFR(createdAt)}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <ol
          className="flex min-h-12 items-center gap-2 overflow-x-auto pb-1 whitespace-nowrap"
          role="list"
        >
          {steps.map((step, index) => {
            const done = currentIndex > index;
            const isCurrent = currentIndex === index;
            const isUpcoming = currentIndex < index;

            return (
              <li key={step} className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                      (done || isCurrent) && "border-slate-900 bg-slate-900 text-white",
                      isUpcoming && "border-border bg-transparent text-transparent"
                    )}
                  >
                    {done ? (
                      <Check className="h-3 w-3" />
                    ) : isCurrent ? (
                      <span className="h-2 w-2 rounded-full bg-current" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-transparent" />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[13px]",
                        isCurrent && "font-semibold text-foreground",
                        done && "font-medium text-muted-foreground",
                        isUpcoming && "font-medium text-muted-foreground"
                      )}
                    >
                      {step}
                    </span>
                    {isCurrent ? <Badge variant="success">En cours</Badge> : null}
                  </div>
                </div>
                {index < steps.length - 1 ? (
                  <span
                    className={cn(
                      "h-px min-w-10 flex-1 rounded-full bg-border"
                    )}
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

export function ReservationAlertCard({
  bookingId,
  alert,
}: {
  bookingId: string;
  alert: ReservationAttentionAlert | null;
}) {
  if (!alert) {
    return null;
  }

  const Icon = alert.severity === "danger" ? AlertCircle : AlertTriangle;

  return (
    <Card
      className={cn(
        "shadow-card",
        alert.severity === "danger"
          ? "border-destructive/30 bg-destructive/[0.03]"
          : "border-amber-200 bg-amber-50/70"
      )}
    >
      <CardContent className="flex flex-col gap-4 px-card-padding pb-card-padding pt-[1.15rem] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              alert.severity === "danger"
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-100 text-amber-700"
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{alert.title}</p>
            <p className="text-sm text-muted-foreground">{alert.message}</p>
          </div>
        </div>
        <Button asChild size="sm" className="w-full shrink-0 sm:w-auto">
          <Link href={`/damage-reports/new?bookingId=${bookingId}`}>Faire l&apos;inspection</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function ReservationClientCard({
  customerId,
  name,
  phone,
  whatsappLink,
  history,
}: {
  customerId: string;
  name: string;
  phone: string | null;
  whatsappLink: string | null;
  history: ReservationCustomerHistorySummary;
}) {
  const callablePhone = formatPhoneForCall(phone);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <Link
            href={`/customers/${customerId}`}
            className="-m-2 flex min-w-0 items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted/20"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(name)}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base transition-colors hover:text-primary">{name}</CardTitle>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {phone ?? "Téléphone non renseigné"}
                </span>
              </p>
            </div>
          </Link>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:justify-end">
            {callablePhone ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={`tel:${callablePhone}`}>Appeler</a>
              </Button>
            ) : null}
            {whatsappLink ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Accès rapide au dossier client pour appeler, envoyer un WhatsApp ou consulter son profil.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReservationVehicleCard({
  vehicleId,
  make,
  model,
  plate,
  color,
  status,
  gearbox,
}: {
  vehicleId: string;
  make: string;
  model: string;
  plate: string;
  color: string;
  status: VehicleStatus;
  gearbox: Gearbox;
}) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/vehicles/${vehicleId}`}
            className="rounded-xl transition-colors hover:bg-muted/20 -m-2 p-2"
          >
            <CardTitle className="text-base transition-colors hover:text-primary">Véhicule</CardTitle>
            <CardDescription>Résumé opérationnel du véhicule affecté</CardDescription>
          </Link>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 pt-0">
        <InfoPair label="Modèle" value={`${make} ${model}`} icon={CarFront} href={`/vehicles/${vehicleId}`} />
        <InfoPair label="Plaque" value={plate} />
        <InfoPair label="Couleur" value={color || "—"} />
        <InfoPair
          label="Transmission"
          value={gearbox === "AUTO" ? "Automatique" : "Manuelle"}
          icon={Gauge}
        />
      </CardContent>
    </Card>
  );
}

export function ReservationDetailsCard({
  startDate,
  endDate,
  durationDays,
  pickupLocation,
  returnLocation,
}: {
  startDate: Date;
  endDate: Date;
  durationDays: number;
  pickupLocation: string | null;
  returnLocation: string | null;
}) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Période de location</CardTitle>
        <CardDescription>Dates, durée et lieux opérationnels</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary/80">
                Période
              </p>
              <p className="mt-1 text-sm font-semibold">
                {formatDateFR(startDate)} <span className="text-muted-foreground">→</span> {formatDateFR(endDate)}
              </p>
            </div>
            <Badge variant="info" className="w-fit">
              {durationDays} jour{durationDays > 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="mt-4 h-2 rounded-full bg-primary/10">
            <div className="h-2 w-1/2 rounded-full bg-primary/70" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoPair label="Date de départ" value={formatDateFR(startDate)} icon={Calendar} />
          <InfoPair label="Date de retour" value={formatDateFR(endDate)} icon={Clock3} />
          <InfoPair label="Lieu de départ" value={pickupLocation || "Agence"} icon={MapPin} />
          <InfoPair label="Lieu de retour" value={returnLocation || "Agence"} icon={MapPin} />
        </div>
      </CardContent>
    </Card>
  );
}

export function ReservationInspectionsCard({
  bookingId,
  hasDepart,
  hasRetour,
  showCreateAction,
  isReturnPending,
}: {
  bookingId: string;
  hasDepart: boolean;
  hasRetour: boolean;
  showCreateAction: boolean;
  isReturnPending: boolean;
}) {
  const rows = [
    {
      label: "Avant départ",
      done: hasDepart,
      pending: false,
    },
    {
      label: "Retour",
      done: hasRetour,
      pending: isReturnPending && !hasRetour,
    },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-base">Inspections</CardTitle>
          <CardDescription>Suivi des contrôles liés à la réservation</CardDescription>
        </div>
        {showCreateAction ? (
          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
            <Link href={`/damage-reports/new?bookingId=${bookingId}`}>Nouvelle inspection</Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5"
          >
            <span className="text-sm font-medium">{row.label}</span>
            <span className="inline-flex items-center gap-2 text-sm">
              {row.done ? (
                <>
                  <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                  Réalisée
                </>
              ) : row.pending ? (
                <Badge variant="warning">En attente</Badge>
              ) : (
                <span className="text-muted-foreground">Non réalisée</span>
              )}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReservationCustomerHistoryCard({
  summary,
}: {
  summary: ReservationCustomerHistorySummary;
}) {
  const rows = [
    { label: "Locations totales", value: String(summary.totalRentals) },
    {
      label: "Durée moyenne",
      value: `${summary.averageDurationDays || 0} jour${summary.averageDurationDays > 1 ? "s" : ""}`,
    },
    { label: "Dernier véhicule", value: summary.lastVehicle || "—" },
    { label: "Total généré", value: formatCurrency(summary.totalGenerated) },
    { label: "Incidents", value: String(summary.incidents) },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Historique client</CardTitle>
        <CardDescription>Vue synthétique des locations précédentes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5"
          >
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="text-sm font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReservationActivityCard({
  currentStatusLabel,
  items,
}: {
  currentStatusLabel: string;
  items: ReservationActivityItem[];
}) {
  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base">Activité</CardTitle>
          <CardDescription>Chronologie récente du dossier</CardDescription>
        </div>
        <Badge variant="outline">{currentStatusLabel}</Badge>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
            Aucune activité horodatée à afficher.
          </div>
        ) : (
          <ul className="space-y-3" role="list">
            {items.map((item, index) => (
              <li key={item.id} className="relative flex gap-3">
                {index < items.length - 1 ? (
                  <span className="absolute left-[7px] top-6 h-[calc(100%-0.25rem)] w-px bg-border" aria-hidden="true" />
                ) : null}
                <span className="relative z-10 mt-1 flex h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-background" />
                <div className="min-w-0 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.occurredAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
