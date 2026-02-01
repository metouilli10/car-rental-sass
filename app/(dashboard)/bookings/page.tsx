import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye } from "lucide-react";

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const bookings = await prisma.booking.findMany({
    where: { agencyId: session.user.agencyId },
    include: {
      customer: true,
      vehicle: true,
      payments: true,
      deposit: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Réservations"
        description="Gérez toutes vos réservations"
        action={{
          label: "Nouvelle réservation",
          href: "/bookings/create",
        }}
      />

      {bookings.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-4">
            Aucune réservation enregistrée
          </p>
          <Button asChild>
            <Link href="/bookings/create">Créer votre première réservation</Link>
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Caution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/50 transition-colors duration-200">
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
        </div>
      )}
    </div>
  );
}
