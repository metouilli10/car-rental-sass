import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Car, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const agencyId = session.user.agencyId;

  // Fetch metrics
  const [
    totalVehicles,
    availableVehicles,
    rentedVehicles,
    depositsHeld,
    pendingPayments,
    todayBookings,
  ] = await Promise.all([
    // Total vehicles
    prisma.vehicle.count({
      where: { agencyId },
    }),

    // Available vehicles
    prisma.vehicle.count({
      where: { agencyId, status: "AVAILABLE" },
    }),

    // Rented vehicles
    prisma.vehicle.count({
      where: { agencyId, status: "RENTED" },
    }),

    // Sum of deposits held
    prisma.deposit.aggregate({
      where: {
        booking: { agencyId },
        status: "HELD",
      },
      _sum: { amount: true },
    }),

    // Count pending payments
    prisma.payment.count({
      where: {
        booking: { agencyId },
        status: "PENDING",
      },
    }),

    // Today's bookings (pickups and returns)
    prisma.booking.findMany({
      where: {
        agencyId,
        OR: [
          {
            startDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
          {
            endDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        ],
      },
      include: {
        customer: true,
        vehicle: true,
        deposit: true,
      },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const depositsHeldAmount = depositsHeld._sum.amount || 0;

  // Get vehicles by status
  const vehiclesByStatus = await prisma.vehicle.groupBy({
    by: ["status"],
    where: { agencyId },
    _count: { id: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Voitures louées"
          value={rentedVehicles}
          icon={Car}
          description={`sur ${totalVehicles} véhicules`}
        />
        <StatCard
          title="Disponibles"
          value={availableVehicles}
          icon={Calendar}
          description="Prêts à louer"
        />
        <StatCard
          title="Cautions retenues"
          value={formatCurrency(depositsHeldAmount)}
          icon={DollarSign}
        />
        <StatCard
          title="Paiements en attente"
          value={pendingPayments}
          icon={AlertCircle}
          description="À encaisser"
        />
      </div>

      {/* Today's Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité d'aujourd'hui</CardTitle>
        </CardHeader>
        <CardContent>
          {todayBookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune activité prévue aujourd'hui
            </p>
          ) : (
            <div className="space-y-4">
              {todayBookings.map((booking) => {
                const isPickup =
                  new Date(booking.startDate).toDateString() ===
                  new Date().toDateString();
                const isReturn =
                  new Date(booking.endDate).toDateString() ===
                  new Date().toDateString();

                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{booking.customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.vehicle.make} {booking.vehicle.model} -{" "}
                        {booking.vehicle.plate}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        {isPickup && (
                          <span className="text-green-600 font-medium">
                            📍 Départ
                          </span>
                        )}
                        {isReturn && (
                          <span className="text-blue-600 font-medium">
                            🏁 Retour
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {formatDate(booking.startDate)} →{" "}
                          {formatDate(booking.endDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={booking.status} />
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/bookings/${booking.id}`}>Voir</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Status */}
      <Card>
        <CardHeader>
          <CardTitle>État du parc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {vehiclesByStatus.map((group) => (
              <div
                key={group.status}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <StatusBadge status={group.status} />
                  <p className="text-2xl font-bold mt-2">{group._count.id}</p>
                </div>
                <Car className="h-8 w-8 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
