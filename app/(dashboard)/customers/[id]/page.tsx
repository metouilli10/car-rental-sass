import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  buildCustomerHistoryRows,
  computeCustomerMetrics,
  type ReturnCondition,
} from "@/lib/customer-history";
import { formatCurrency, formatDate } from "@/lib/utils";

const INFRACTION_TYPE_LABELS: Record<string, string> = {
  SPEEDING: "Excès de vitesse",
  PARKING: "Stationnement",
  RED_LIGHT: "Feu rouge",
  PHONE: "Téléphone",
  SEATBELT: "Ceinture",
  DOCUMENTS: "Documents",
  OTHER: "Autre",
};

const INFRACTION_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "destructive" | "info" | "secondary" }
> = {
  PENDING: { label: "En attente", variant: "warning" },
  ASSIGNED: { label: "Assignée", variant: "info" },
  PAID: { label: "Payée", variant: "success" },
  CONTESTED: { label: "Contestée", variant: "destructive" },
};

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
      infractions: {
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          status: true,
          type: true,
          amount: true,
          bookingId: true,
          notes: true,
        },
      },
      bookings: {
        where: { agencyId: session.user.agencyId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          actualReturnDate: true,
          createdAt: true,
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
          infractions: {
            select: {
              id: true,
              date: true,
              status: true,
              type: true,
              amount: true,
              bookingId: true,
              notes: true,
            },
          },
          damageReports: {
            where: { inspectionType: "RETOUR" },
            orderBy: { reportedAt: "desc" },
            select: {
              id: true,
              inspectionType: true,
              reportedAt: true,
              depositAction: true,
              deductFromDeposit: true,
              deductedAmount: true,
              cleanliness: true,
              totalDamageCost: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const metrics = computeCustomerMetrics(customer.bookings, customer.infractions);
  const historyRows = buildCustomerHistoryRows(customer.bookings);
  const notes = customer.bookings
    .filter((booking) => booking.status !== "CANCELED")
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total réservations" value={String(metrics.totalReservations)} />
        <MetricCard label="Total revenus" value={formatCurrency(metrics.totalRevenue)} />
        <MetricCard label="Infractions" value={String(metrics.totalInfractions)} />
        <MetricCard label="Retours en bon état" value={String(metrics.goodReturns)} tone="success" />
        <MetricCard label="Retours en mauvais état" value={String(metrics.badReturns)} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Informations client</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoRow
              label="Type"
              value={
                customer.customerType === "PERSONNE_MORALE" ? "Personne morale" : "Personne physique"
              }
            />
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Historique des réservations</h2>
          <Button asChild variant="outline" size="sm">
            <Link href={`/bookings/create?customerId=${customer.id}`}>Nouvelle réservation</Link>
          </Button>
        </div>

        {customer.bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune réservation pour ce client.</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {historyRows.map((row) => {
                return (
                  <div key={row.bookingId} className="rounded-xl border border-muted p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/bookings/${row.bookingId}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          Réservation {row.bookingId.slice(0, 8)}
                        </Link>
                        <p className="text-sm text-foreground">{row.vehicleLabel}</p>
                        <p className="text-xs text-muted-foreground">{row.plate}</p>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <HistoryInfo label="Période" value={`${formatDate(row.startDate)} - ${formatDate(row.endDate)}`} />
                      <HistoryInfo
                        label="Solde"
                        value={formatCurrency(row.remainingAmount)}
                        valueBadge={row.remainingAmount > 0 ? "warning" : undefined}
                      />
                      <HistoryInfo
                        label="Retour"
                        value={getReturnConditionLabel(row.returnCondition)}
                        valueBadge={getReturnConditionVariant(row.returnCondition)}
                      />
                      <HistoryInfo
                        label="Infractions"
                        value={String(row.bookingInfractionCount)}
                        valueBadge={row.bookingInfractionCount > 0 ? "warning" : "secondary"}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/bookings/${row.bookingId}`}>Voir la réservation</Link>
                      </Button>
                      {row.returnInspectionId ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/damage-reports/${row.returnInspectionId}`}>Voir l&apos;inspection</Link>
                        </Button>
                      ) : null}
                      {row.bookingInfractionCount > 0 ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/infractions?search=${encodeURIComponent(customer.name)}`}>
                            Voir les infractions
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px]">
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
                      Solde
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      Retour
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      Infractions
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/60">
                  {historyRows.map((row) => (
                    <tr key={row.bookingId} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        <Link href={`/bookings/${row.bookingId}`} className="font-medium text-primary hover:underline">
                          {row.bookingId.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {row.vehicleLabel}
                        <p className="text-xs text-muted-foreground">{row.plate}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(row.startDate)} - {formatDate(row.endDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {row.remainingAmount > 0 ? (
                          <Badge variant="warning">{formatCurrency(row.remainingAmount)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">{formatCurrency(row.remainingAmount)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getReturnConditionVariant(row.returnCondition)}>
                          {getReturnConditionLabel(row.returnCondition)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={row.bookingInfractionCount > 0 ? "warning" : "secondary"}>
                          {row.bookingInfractionCount}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/bookings/${row.bookingId}`} className="text-primary hover:underline">
                            Réservation
                          </Link>
                          {row.returnInspectionId ? (
                            <Link
                              href={`/damage-reports/${row.returnInspectionId}`}
                              className="text-primary hover:underline"
                            >
                              Inspection
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground">Infractions du client</h2>
        {customer.infractions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucune infraction attribuée à ce client.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {customer.infractions.map((infraction) => (
              <div
                key={infraction.id}
                className="flex flex-col gap-3 rounded-xl border border-muted p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {INFRACTION_TYPE_LABELS[infraction.type] ?? infraction.type}
                    </p>
                    <InfractionStatusBadge status={infraction.status} />
                    {typeof infraction.amount === "number" ? (
                      <Badge variant="secondary">{formatCurrency(infraction.amount)}</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(infraction.date)}
                    {infraction.bookingId ? ` • Réservation ${infraction.bookingId.slice(0, 8)}` : ""}
                  </p>
                  {infraction.notes ? (
                    <p className="text-sm text-muted-foreground">{infraction.notes}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {infraction.bookingId ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/bookings/${infraction.bookingId}`}>Voir la réservation</Link>
                    </Button>
                  ) : null}
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/infractions/${infraction.id}`}>Voir l&apos;infraction</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground">Notes</h2>
        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucune note disponible pour ce client.</p>
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
  tone?: "neutral" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "bg-amber-50 text-amber-900"
      : tone === "success"
        ? "bg-emerald-50 text-emerald-900"
        : "bg-white text-foreground";

  return (
    <div className={`rounded-2xl p-5 shadow-card ${toneClass}`}>
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

function HistoryInfo({
  label,
  value,
  valueBadge,
}: {
  label: string;
  value: string;
  valueBadge?: "default" | "success" | "warning" | "destructive" | "info" | "secondary";
}) {
  return (
    <div className="rounded-lg border border-muted p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2">
        {valueBadge ? <Badge variant={valueBadge}>{value}</Badge> : <p className="text-sm text-foreground">{value}</p>}
      </div>
    </div>
  );
}

function InfractionStatusBadge({ status }: { status: string }) {
  const config = INFRACTION_STATUS_CONFIG[status] ?? {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getReturnConditionLabel(condition: ReturnCondition) {
  if (condition === "GOOD") {
    return "Bon état";
  }

  if (condition === "BAD") {
    return "Mauvais état";
  }

  return "Aucune inspection retour";
}

function getReturnConditionVariant(condition: ReturnCondition) {
  if (condition === "GOOD") {
    return "success" as const;
  }

  if (condition === "BAD") {
    return "warning" as const;
  }

  return "secondary" as const;
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
