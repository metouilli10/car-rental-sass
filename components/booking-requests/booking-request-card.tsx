import { BookingRequestStatus } from "@prisma/client";
import Link from "next/link";
import { approveBookingRequest, rejectBookingRequest, startBookingRequestConversion } from "@/lib/actions/booking-requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { withLocalePath } from "@/lib/i18n/config";
import type { BookingRequestListItem, BookingRequestOperationalState } from "@/lib/storefront/queries";
import { cn } from "@/lib/utils";

interface BookingRequestCardProps {
  request: BookingRequestListItem;
  locale: "fr" | "ar";
  highlighted?: boolean;
}

const statusVariant: Record<BookingRequestStatus, "default" | "success" | "destructive" | "secondary"> = {
  PENDING: "default",
  APPROVED: "success",
  REJECTED: "destructive",
  CONVERTED: "secondary",
};

const statusLabel: Record<BookingRequestStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvée",
  REJECTED: "Rejetée",
  CONVERTED: "Convertie",
};

const operationalVariant: Record<
  BookingRequestOperationalState,
  "success" | "warning" | "secondary" | "info"
> = {
  AVAILABLE: "success",
  INTERNAL_CONFLICT: "warning",
  TO_CONFIRM: "secondary",
  PARTNER_AGENCY: "info",
};

const operationalLabel: Record<BookingRequestOperationalState, string> = {
  AVAILABLE: "Disponible",
  INTERNAL_CONFLICT: "Conflit avec parc interne",
  TO_CONFIRM: "À confirmer",
  PARTNER_AGENCY: "Peut être traité via agence partenaire",
};

export function BookingRequestCard({ request, locale, highlighted = false }: BookingRequestCardProps) {
  return (
    <Card
      id={`request-${request.id}`}
      className={cn(
        "overflow-hidden border-slate-200 shadow-card",
        !request.isRead && "bg-emerald-50/40",
        highlighted && "border-primary/30 bg-primary/[0.04] ring-1 ring-primary/20"
      )}
    >
      <CardContent className="space-y-3 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-slate-900">{request.fullName}</p>
              {!request.isRead ? <Badge variant="info">Nouvelle</Badge> : null}
            </div>
            <p className="text-sm text-slate-500">{request.phone}</p>
            <p className="break-all text-sm text-slate-500">{request.email}</p>
            <p className="text-xs text-slate-400">
              Reçue le {formatDateTime(request.createdAt)}
              {highlighted ? " · demande ciblée" : ""}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Badge variant="info">WEBSITE</Badge>
            <Badge variant={statusVariant[request.status]}>{statusLabel[request.status]}</Badge>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
          <CompactRow
            label="Véhicule"
            value={`${request.vehicle.make} ${request.vehicle.model}`}
            meta={request.vehicle.plate}
          />
          <CompactRow
            label="Dates"
            value={formatDate(request.pickupDate)}
            meta={`Retour ${formatDate(request.returnDate)}`}
          />
          <CompactRow
            label="Trajet"
            value={request.pickupLocation}
            meta={`Vers ${request.returnLocation}`}
          />
          <div className="space-y-1 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Traitement</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={operationalVariant[request.operationalState]}>
                {operationalLabel[request.operationalState]}
              </Badge>
            </div>
            <p className="text-sm leading-5 text-slate-600">{getOperationalHint(request.operationalState)}</p>
          </div>
        </div>

        {request.note ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Note</p>
            <p className="mt-1 text-sm leading-5 text-slate-600">{request.note}</p>
          </div>
        ) : null}

        {request.bookingId ? (
          <Link
            href={withLocalePath(locale, `/bookings/${request.bookingId}`)}
            className="block text-sm font-medium text-blue-700 hover:underline"
          >
            Voir la réservation liée
          </Link>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
          <Button asChild type="button" size="sm" variant="ghost">
            <Link href={`${withLocalePath(locale, "/booking-requests")}?requestId=${request.id}#request-${request.id}`}>
              Voir détails
            </Link>
          </Button>
          <form
            action={async () => {
              "use server";
              await approveBookingRequest(request.id);
            }}
          >
            <Button type="submit" size="sm" variant="outline" disabled={request.status !== "PENDING"}>
              Approuver
            </Button>
          </form>
          {request.status === "APPROVED" && !request.bookingId ? (
            <form
              action={async () => {
                "use server";
                await startBookingRequestConversion(request.id, locale);
              }}
            >
              <Button type="submit" size="sm">
                Convertir
              </Button>
            </form>
          ) : null}
          <form
            action={async () => {
              "use server";
              await rejectBookingRequest(request.id);
            }}
          >
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className={cn("text-red-600 hover:text-red-700", request.status !== "PENDING" && "opacity-50")}
              disabled={request.status !== "PENDING"}
            >
              Rejeter
            </Button>
          </form>
        </div>

        {request.status === "CONVERTED" && request.bookingId ? (
          <p className="text-xs text-slate-400">Réservation créée et liée à cette demande.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CompactRow({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta?: string;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[88px_minmax(0,1fr)] sm:items-start sm:gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-800">{value}</p>
        {meta ? <p className="mt-0.5 text-sm text-slate-500">{meta}</p> : null}
      </div>
    </div>
  );
}

function getOperationalHint(state: BookingRequestOperationalState) {
  switch (state) {
    case "AVAILABLE":
      return "Aucun conflit interne détecté sur le véhicule demandé.";
    case "INTERNAL_CONFLICT":
      return "Le lead reste exploitable, mais la flotte interne montre déjà un chevauchement.";
    case "PARTNER_AGENCY":
      return "Le véhicule demandé n'est pas mobilisable en interne sur l'état actuel.";
    default:
      return "Disponibilité à valider manuellement avant confirmation.";
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
