import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CalendarDays, CarFront, CircleCheckBig, HandCoins, Phone, UserRound } from "lucide-react";
import {
  approveAndStartBookingRequestConversion,
  approveBookingRequest,
  rejectBookingRequest,
  startBookingRequestConversion,
} from "@/lib/actions/booking-requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { withLocalePath } from "@/lib/i18n/config";
import type { BookingRequestListItem, BookingRequestOperationalState } from "@/lib/storefront/queries";

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

function getRecommendation(state: BookingRequestOperationalState) {
  switch (state) {
    case "AVAILABLE":
      return {
        title: "Traitement fluide",
        description:
          "Le véhicule demandé ne présente pas de conflit interne détecté. Vous pouvez approuver puis convertir si tout est validé avec le client.",
        icon: CircleCheckBig,
      };
    case "INTERNAL_CONFLICT":
      return {
        title: "Conflit interne non bloquant",
        description:
          "Le lead reste exploitable. Vérifiez une autre voiture du parc ou confirmez une solution alternative avant conversion.",
        icon: AlertTriangle,
      };
    case "PARTNER_AGENCY":
      return {
        title: "Option partenaire à envisager",
        description:
          "Le véhicule demandé n'est pas mobilisable en interne sur son état actuel. La demande peut néanmoins être traitée via une autre voiture ou une agence partenaire.",
        icon: HandCoins,
      };
    default:
      return {
        title: "Validation manuelle requise",
        description:
          "La demande doit être confirmée opérationnellement avant approbation. Contactez le client et vérifiez la meilleure option de traitement.",
        icon: UserRound,
      };
  }
}

export function BookingRequestDetailCard({
  request,
  locale,
}: {
  request: BookingRequestListItem;
  locale: "fr" | "ar";
}) {
  const recommendation = getRecommendation(request.operationalState);
  const RecommendationIcon = recommendation.icon;

  return (
    <Card className="border-primary/15 bg-primary/[0.03] shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">WEBSITE</Badge>
            {!request.isRead ? <Badge variant="success">Nouvelle</Badge> : null}
            <Badge variant={operationalVariant[request.operationalState]}>
              {operationalLabel[request.operationalState]}
            </Badge>
          </div>
          <div>
            <CardTitle className="text-xl">Demande web #{request.id.slice(0, 8)}</CardTitle>
            <p className="mt-2 text-sm text-slate-600">
              Reçue le {formatDateTime(request.createdAt)} pour {request.fullName}.
            </p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href={withLocalePath(locale, "/booking-requests")}>
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-primary shadow-sm">
              <RecommendationIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-950">{recommendation.title}</p>
              <p className="mt-1 text-sm text-slate-600">{recommendation.description}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Action recommandée</p>
              <p className="mt-1 text-sm text-slate-600">
                {request.status === "CONVERTED" && request.bookingId
                  ? "La demande a déjà été transformée en réservation. Vous pouvez ouvrir la fiche liée ou recontacter le client."
                  : request.status === "REJECTED"
                    ? "La demande a été rejetée. Vous pouvez recontacter le client si une nouvelle option devient disponible."
                    : request.status === "APPROVED"
                      ? request.operationalState === "AVAILABLE"
                        ? "Convertissez directement cette demande en réservation préremplie."
                        : request.operationalState === "INTERNAL_CONFLICT"
                          ? "Ouvrez la conversion et choisissez un autre véhicule interne avant validation finale."
                          : request.operationalState === "PARTNER_AGENCY"
                            ? "Préparez la réservation avec une alternative interne ou partenaire, puis confirmez avec le client."
                            : "Finalisez la validation opérationnelle puis convertissez la demande."
                      : request.operationalState === "AVAILABLE"
                        ? "Vous pouvez approuver puis convertir rapidement cette demande."
                        : request.operationalState === "INTERNAL_CONFLICT"
                          ? "Approuvez la demande, puis cherchez une autre voiture avant l'enregistrement final."
                          : request.operationalState === "PARTNER_AGENCY"
                            ? "Approuvez la demande si elle reste pertinente, puis traitez-la avec une solution alternative."
                          : "Commencez par valider la demande, puis préparez la réservation avec l'équipe."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {request.bookingId ? (
                <Button asChild>
                  <Link href={withLocalePath(locale, `/bookings/${request.bookingId}`)}>
                    Voir la réservation liée
                  </Link>
                </Button>
              ) : request.status === "APPROVED" ? (
                <form
                  action={async () => {
                    "use server";
                    await startBookingRequestConversion(request.id, locale);
                  }}
                >
                  <Button type="submit">
                    {request.operationalState === "AVAILABLE"
                      ? "Convertir en réservation"
                      : request.operationalState === "INTERNAL_CONFLICT"
                        ? "Chercher une autre voiture"
                        : request.operationalState === "PARTNER_AGENCY"
                          ? "Traiter via partenaire"
                          : "Préparer la réservation"}
                  </Button>
                </form>
              ) : request.status === "PENDING" ? (
                <>
                  <form
                    action={async () => {
                      "use server";
                      await approveAndStartBookingRequestConversion(request.id, locale);
                    }}
                  >
                    <Button type="submit">
                      {request.operationalState === "AVAILABLE"
                        ? "Approuver puis convertir"
                        : request.operationalState === "INTERNAL_CONFLICT"
                          ? "Approuver puis chercher une voiture"
                          : request.operationalState === "PARTNER_AGENCY"
                            ? "Approuver puis traiter via partenaire"
                            : "Approuver puis préparer"}
                    </Button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await approveBookingRequest(request.id);
                    }}
                  >
                    <Button type="submit" variant="outline">
                      Approuver seulement
                    </Button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await rejectBookingRequest(request.id);
                    }}
                  >
                    <Button type="submit" variant="ghost" className="text-red-600 hover:text-red-700">
                      Rejeter
                    </Button>
                  </form>
                </>
              ) : null}

              <Button asChild variant="outline">
                <Link href={`tel:${request.phone}`}>
                  <Phone className="h-4 w-4" />
                  Appeler le client
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <InfoBlock
            icon={<UserRound className="h-4 w-4" />}
            title="Client"
            lines={[request.fullName, request.phone, request.email]}
          />
          <InfoBlock
            icon={<CarFront className="h-4 w-4" />}
            title="Véhicule demandé"
            lines={[`${request.vehicle.make} ${request.vehicle.model}`, request.vehicle.plate]}
          />
          <InfoBlock
            icon={<CalendarDays className="h-4 w-4" />}
            title="Période"
            lines={[
              `Départ ${formatDate(request.pickupDate)}`,
              `Retour ${formatDate(request.returnDate)}`,
              `${request.pickupLocation} -> ${request.returnLocation}`,
            ]}
          />
        </div>

        {request.note ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-900">Note du client</p>
            <p className="mt-2 text-sm text-slate-600">{request.note}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InfoBlock({
  icon,
  title,
  lines,
}: {
  icon: ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <div className="mt-3 space-y-1 text-sm text-slate-600">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
