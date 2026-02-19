import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Play, CheckCircle, XCircle, FileText, Send, Users } from "lucide-react";
import Link from "next/link";
import { BookingStatusActions } from "@/components/bookings/booking-status-actions";

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      payments: true,
      deposit: true,
      damageReports: {
        include: {
          damagePhotos: true,
          sections: true,
        },
        orderBy: { reportedAt: "desc" },
      },
    },
  });

  if (!booking || booking.agencyId !== session.user.agencyId) {
    notFound();
  }

  const whatsappMessage = encodeURIComponent(
    `Bonjour ${booking.customer.name},\n\nConcernant votre réservation du ${formatDate(
      booking.startDate
    )} au ${formatDate(booking.endDate)} pour le véhicule ${
      booking.vehicle.make
    } ${booking.vehicle.model} (${booking.vehicle.plate}).\n\nCordialement,\n${
      session.user.agencyName
    }`
  );

  const whatsappLink = `https://wa.me/${booking.customer.phone.replace(
    /\D/g,
    ""
  )}?text=${whatsappMessage}`;

  const payment = booking.payments[0];
  const numberOfDays = Math.ceil(
    (new Date(booking.endDate).getTime() -
      new Date(booking.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Détails de la réservation"
        description={`Réservation #${booking.id.slice(0, 8)}`}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nom</p>
              <p className="font-medium">{booking.customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <p className="font-medium">{booking.customer.phone}</p>
            </div>
            {booking.customer.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{booking.customer.email}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Passeport/CIN</p>
              <p className="font-medium">{booking.customer.passportOrCIN}</p>
            </div>
            <Button asChild className="w-full" variant="outline">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contacter sur WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card>
          <CardHeader>
            <CardTitle>Véhicule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Véhicule</p>
              <p className="font-medium">
                {booking.vehicle.make} {booking.vehicle.model}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plaque</p>
              <p className="font-medium">{booking.vehicle.plate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Couleur</p>
              <p className="font-medium">{booking.vehicle.color}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut du véhicule</p>
              <StatusBadge status={booking.vehicle.status} />
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Détails de la réservation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <StatusBadge status={booking.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de début</p>
              <p className="font-medium">{formatDate(booking.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de fin</p>
              <p className="font-medium">{formatDate(booking.endDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Durée</p>
              <p className="font-medium">{numberOfDays} jour(s)</p>
            </div>
            {booking.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations financières</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Prix par jour</p>
              <p className="font-medium">{formatCurrency(booking.pricePerDay)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prix total</p>
              <p className="text-lg font-bold">
                {formatCurrency(booking.totalPrice)}
              </p>
            </div>
            <div className="pt-2 border-t border-muted">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Paiement</p>
                {payment && <StatusBadge status={payment.status} />}
              </div>
              {payment && (
                <p className="text-sm">
                  {payment.type === "CASH" && "Espèces"}
                  {payment.type === "CARD" && "Carte bancaire"}
                  {payment.type === "TRANSFER" && "Virement"}
                  {" - "}
                  {formatCurrency(payment.amount)}
                </p>
              )}
            </div>
            <div className="pt-2 border-t border-muted">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Caution</p>
                {booking.deposit && (
                  <StatusBadge status={booking.deposit.status} />
                )}
              </div>
              <p className="font-medium">
                {formatCurrency(booking.depositAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingStatusActions
            bookingId={booking.id}
            currentStatus={booking.status}
            canCancel={session.user.role === "OWNER" || session.user.role === "MANAGER"}
          />
        </CardContent>
      </Card>

      {/* Inspections */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inspections</CardTitle>
          <Button asChild size="sm">
            <Link href={`/damage-reports/new?bookingId=${booking.id}`}>
              Nouvelle inspection
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {booking.damageReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune inspection enregistrée.</p>
          ) : (
            <div className="space-y-3">
              {booking.damageReports.map((report) => {
                const hasDamage = report.sections.some((s) => s.status === "DAMAGE");
                return (
                  <div key={report.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {report.inspectionType === "DEPART" ? "Départ" : "Retour"}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${hasDamage ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {hasDamage ? "Dommages" : "OK"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(report.reportedAt)}</p>
                      {report.totalDamageCost > 0 && (
                        <p className="text-xs text-red-600 font-medium">Coût: {formatCurrency(report.totalDamageCost)}</p>
                      )}
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/damage-reports/${report.id}`}>
                        Voir
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
