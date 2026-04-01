import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth-cache";
import { getInfraction } from "@/lib/actions/infractions";
import { canDelete } from "@/lib/authz";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { InfractionStatusActions } from "@/components/infractions/infraction-status-actions";
import { InfractionDetailAssign } from "@/components/infractions/infraction-detail-assign";
import {
  INFRACTION_TYPE_LABELS,
} from "@/components/infractions/infraction-constants";
import {
  ArrowLeft,
  Car,
  CalendarDays,
  Clock,
  User,
  Phone,
  CreditCard,
  FileText,
  Banknote,
} from "lucide-react";

export default async function InfractionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const infraction = await getInfraction(id);
  if (!infraction) notFound();

  const userCanDelete = canDelete(session.user.role);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/infractions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Infractions
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[1.75rem] font-semibold tracking-tight">
              {INFRACTION_TYPE_LABELS[infraction.type] || infraction.type}
            </h1>
            <StatusBadge status={infraction.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Créée le {formatDate(infraction.createdAt)}
          </p>
        </div>
        <InfractionStatusActions
          infractionId={infraction.id}
          currentStatus={infraction.status}
          canDeleteInfraction={userCanDelete}
        />
      </div>

      {/* Info grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Vehicle card */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Car className="h-3.5 w-3.5" />
              Véhicule
            </div>
            <p className="text-sm font-medium">
              {infraction.vehicle.make} {infraction.vehicle.model}
            </p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {infraction.vehicle.plate}
            </p>
            <Link
              href={`/vehicles`}
              className="mt-2 inline-block text-xs text-primary hover:underline"
            >
              Voir le véhicule →
            </Link>
          </CardContent>
        </Card>

        {/* Details card */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Détails
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{formatDate(infraction.date)}</span>
              </div>
              {infraction.time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{infraction.time}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {INFRACTION_TYPE_LABELS[infraction.type] || infraction.type}
                </span>
              </div>
              {infraction.amount != null && infraction.amount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-red-600">
                    {formatCurrency(infraction.amount)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client card */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Client responsable
            </div>
            {infraction.clientName ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">{infraction.clientName}</p>
                {infraction.clientCin && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-3 w-3" />
                    <span>{infraction.clientCin}</span>
                  </div>
                )}
                {infraction.clientPhone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{infraction.clientPhone}</span>
                  </div>
                )}
                {infraction.booking && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <CalendarDays className="mr-1 inline h-3 w-3" />
                    Réservation: {formatDate(infraction.booking.startDate)} →{" "}
                    {formatDate(infraction.booking.endDate)}
                  </div>
                )}
                {infraction.customerId && (
                  <Link
                    href={`/customers/${infraction.customerId}`}
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    Voir le client →
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/60">Non assigné</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {infraction.notes && (
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notes
            </h3>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {infraction.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assign panel for unassigned infractions */}
      {infraction.status === "PENDING" && !infraction.bookingId && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">
            Rechercher le client responsable
          </h3>
          <InfractionDetailAssign
            infractionId={infraction.id}
            vehicleId={infraction.vehicleId}
            date={infraction.date.toISOString()}
            time={infraction.time}
          />
        </div>
      )}
    </div>
  );
}
