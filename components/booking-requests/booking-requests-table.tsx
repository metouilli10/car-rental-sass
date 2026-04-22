import { BookingRequestStatus } from "@prisma/client";
import { approveBookingRequest, rejectBookingRequest, startBookingRequestConversion } from "@/lib/actions/booking-requests";
import Link from "next/link";
import { withLocalePath } from "@/lib/i18n/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { BookingRequestListItem, BookingRequestOperationalState } from "@/lib/storefront/queries";

interface BookingRequestsTableProps {
  requests: BookingRequestListItem[];
  locale: "fr" | "ar";
  highlightedRequestId?: string;
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

export function BookingRequestsTable({ requests, locale, highlightedRequestId }: BookingRequestsTableProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm font-medium text-slate-900">Aucune demande pour le moment</p>
        <p className="mt-2 text-sm text-slate-500">
          Les demandes reçues depuis le storefront apparaîtront ici pour validation manuelle.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Véhicule</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Trajet</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Traitement</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow
              key={request.id}
              id={`request-${request.id}`}
              className={cn(
                !request.isRead && "bg-emerald-50/50",
                highlightedRequestId === request.id && "bg-primary/[0.04] ring-1 ring-inset ring-primary/20"
              )}
            >
              <TableCell>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{request.fullName}</p>
                    {!request.isRead ? <Badge variant="info">Nouvelle</Badge> : null}
                  </div>
                  <p className="text-xs text-slate-500">{request.phone}</p>
                  <p className="text-xs text-slate-500">{request.email}</p>
                  <p className="text-xs text-slate-400">
                    Reçue le {formatDateTime(request.createdAt)}
                    {highlightedRequestId === request.id ? " · demande ciblée" : ""}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">
                    {request.vehicle.make} {request.vehicle.model}
                  </p>
                  <p className="text-xs text-slate-500">{request.vehicle.plate}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm text-slate-700">
                  <p>{formatDate(request.pickupDate)}</p>
                  <p className="text-xs text-slate-500">Retour {formatDate(request.returnDate)}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm text-slate-700">
                  <p>{request.pickupLocation}</p>
                  <p className="text-xs text-slate-500">Vers {request.returnLocation}</p>
                  {request.note ? <p className="text-xs text-slate-400">Note : {request.note}</p> : null}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="info">WEBSITE</Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Badge variant={operationalVariant[request.operationalState]}>
                    {operationalLabel[request.operationalState]}
                  </Badge>
                  <p className="text-xs text-slate-500">
                    {request.operationalState === "AVAILABLE"
                      ? "Aucun conflit interne détecté sur le véhicule demandé."
                      : request.operationalState === "INTERNAL_CONFLICT"
                        ? "Le lead reste exploitable, mais la flotte interne montre déjà un chevauchement."
                        : request.operationalState === "PARTNER_AGENCY"
                          ? "Le véhicule demandé n'est pas mobilisable en interne sur l'état actuel."
                          : "Disponibilité à valider manuellement avant confirmation."}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Badge variant={statusVariant[request.status]}>{statusLabel[request.status]}</Badge>
                  {request.bookingId ? (
                    <Link href={withLocalePath(locale, `/bookings/${request.bookingId}`)} className="block text-xs font-medium text-blue-700 hover:underline">
                      Voir la réservation liée
                    </Link>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button asChild type="button" size="sm" variant="ghost">
                    <Link
                      href={`${withLocalePath(locale, "/booking-requests")}?requestId=${request.id}#request-${request.id}`}
                    >
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
                  <p className="mt-2 text-xs text-slate-400">Réservation créée et liée à cette demande.</p>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
