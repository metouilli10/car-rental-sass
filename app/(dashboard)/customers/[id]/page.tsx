import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: {
      id,
      agencyId: session.user.agencyId,
    },
    select: {
      id: true,
      name: true,
      customerType: true,
      email: true,
      phone: true,
      nationality: true,
      passportOrCIN: true,
      address: true,
      representativeName: true,
      passportPhotoUrl: true,
      licensePhotoUrl: true,
      createdAt: true,
      bookings: {
        where: { agencyId: session.user.agencyId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          totalPrice: true,
          remainingAmount: true,
          status: true,
          notes: true,
          vehicle: {
            select: {
              make: true,
              model: true,
              plate: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const activeBookings = customer.bookings.filter((booking) => booking.status !== "CANCELED");
  const totalReservations = activeBookings.length;
  const totalRevenue = activeBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const outstandingBalance = activeBookings.reduce(
    (sum, booking) => sum + booking.remainingAmount,
    0,
  );
  const notes = activeBookings
    .map((booking) => ({
      bookingId: booking.id,
      note: booking.notes?.trim(),
      date: booking.startDate,
    }))
    .filter((item): item is { bookingId: string; note: string; date: Date } => Boolean(item.note));

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        description={`Client depuis le ${formatDate(customer.createdAt)}`}
        action={{
          label: "Modifier le client",
          href: `/customers/${customer.id}/edit`,
        }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total réservations" value={String(totalReservations)} />
        <MetricCard label="Total revenus" value={formatCurrency(totalRevenue)} />
        <MetricCard
          label="Solde en attente"
          value={formatCurrency(outstandingBalance)}
          tone={outstandingBalance > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Informations client</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoRow label="Type" value={customer.customerType === "PERSONNE_MORALE" ? "Personne morale" : "Personne physique"} />
            <InfoRow label="Téléphone" value={customer.phone} />
            <InfoRow label="Email" value={customer.email || "Non renseigné"} />
            <InfoRow label="Nationalité" value={customer.nationality} />
            <InfoRow label="Passeport/CIN" value={customer.passportOrCIN || "Non renseigné"} />
            <InfoRow label="Représentant" value={customer.representativeName || "Non renseigné"} />
            <InfoRow label="Adresse" value={customer.address || "Non renseignée"} />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">Documents</h2>
          <div className="mt-4 space-y-3">
            <DocumentRow
              label="Passeport / CIN"
              url={customer.passportPhotoUrl}
              editHref={`/customers/${customer.id}/edit?tab=documents`}
            />
            <DocumentRow
              label="Permis de conduire"
              url={customer.licensePhotoUrl}
              editHref={`/customers/${customer.id}/edit?tab=documents`}
            />
          </div>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Historique des réservations</h2>
          <Button asChild variant="outline" size="sm">
            <Link href={`/bookings/create?customerId=${customer.id}`}>Nouvelle réservation</Link>
          </Button>
        </div>

        {customer.bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune réservation pour ce client.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Réservation
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Véhicule
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Période
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Solde
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/60">
                {customer.bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/bookings/${booking.id}`} className="font-medium text-primary hover:underline">
                        {booking.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {booking.vehicle.make} {booking.vehicle.model}
                      <p className="text-xs text-muted-foreground">{booking.vehicle.plate}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {booking.remainingAmount > 0 ? (
                        <Badge variant="warning">{formatCurrency(booking.remainingAmount)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">{formatCurrency(booking.remainingAmount)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground">Notes</h2>
        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune note disponible pour ce client.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {notes.map((item) => (
              <div key={`${item.bookingId}-${item.date.toISOString()}`} className="rounded-xl border border-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Réservation {item.bookingId.slice(0, 8)} • {formatDate(item.date)}
                </p>
                <p className="mt-1 text-sm text-foreground">{item.note}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-card ${
        tone === "warning" ? "bg-amber-50 text-amber-900" : "bg-white text-foreground"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-muted p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function DocumentRow({
  label,
  url,
  editHref,
}: {
  label: string;
  url: string | null;
  editHref: string;
}) {
  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-muted p-3 text-sm text-muted-foreground">
        {label}: Non fourni
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-muted p-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <a href={url} target="_blank" rel="noopener noreferrer">
            Ouvrir
          </a>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href={editHref}>Mettre à jour</Link>
        </Button>
      </div>
    </div>
  );
}
