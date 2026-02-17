import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye } from "lucide-react";

const PAGE_SIZE = 25;

interface BookingsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const where = { agencyId: session.user.agencyId };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        totalPrice: true,
        depositAmount: true,
        status: true,
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { make: true, model: true, plate: true } },
        deposit: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Réservations"
        description="Gérez toutes vos réservations"
        action={{
          label: "Nouvelle réservation",
          href: "/bookings/create",
        }}
      />

      {bookings.length === 0 && page === 1 ? (
        <div className="text-center py-16 rounded-2xl bg-white shadow-card">
          <p className="text-muted-foreground mb-4">
            Aucune réservation enregistrée
          </p>
          <Button asChild>
            <Link href="/bookings/create">Créer votre première réservation</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-transparent border-b border-muted">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Caution
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/60">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/40 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">{booking.customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">
                        {booking.vehicle.make} {booking.vehicle.model}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.vehicle.plate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="text-foreground">{formatDate(booking.startDate)}</div>
                      <div className="text-muted-foreground">
                        → {formatDate(booking.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        {formatCurrency(booking.depositAmount)}
                      </div>
                      {booking.deposit && (
                        <div className="mt-1">
                          <StatusBadge status={booking.deposit.status} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/bookings/${booking.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} baseUrl="/bookings" />
        </div>
      )}
    </div>
  );
}
