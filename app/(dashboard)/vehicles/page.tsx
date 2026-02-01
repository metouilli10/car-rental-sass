import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit } from "lucide-react";
import { DeleteVehicleButton } from "@/components/vehicles/delete-vehicle-button";
import type { VehicleStatus } from "@prisma/client";

type SearchParams = { status?: string };

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const { status } = await searchParams;
  const statusFilter =
    status === "AVAILABLE" || status === "RENTED" || status === "MAINTENANCE"
      ? (status as VehicleStatus)
      : undefined;

  const vehicles = await prisma.vehicle.findMany({
    where: {
      agencyId: session.user.agencyId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    include:
      statusFilter === "RENTED"
        ? {
            bookings: {
              where: { status: "ACTIVE" },
              take: 1,
              include: { customer: true },
            },
          }
        : undefined,
  });

  const isRentedView = statusFilter === "RENTED";
  const isAvailableView = statusFilter === "AVAILABLE";

  const title = isAvailableView
    ? "Véhicules disponibles"
    : isRentedView
      ? "Véhicules loués"
      : "Véhicules";
  const description = isAvailableView
    ? "Véhicules prêts à être loués"
    : isRentedView
      ? "Véhicules actuellement en location avec informations de location"
      : "Gérez votre parc automobile";

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        action={
          !isRentedView
            ? {
                label: "Ajouter un véhicule",
                href: "/vehicles/add",
              }
            : undefined
        }
      />

      <div className="flex items-center gap-2">
        <Button variant={!statusFilter ? "default" : "outline"} size="sm" asChild>
          <Link href="/vehicles">Tous</Link>
        </Button>
        <Button
          variant={isAvailableView ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link href="/vehicles?status=AVAILABLE">Disponibles</Link>
        </Button>
        <Button variant={isRentedView ? "default" : "outline"} size="sm" asChild>
          <Link href="/vehicles?status=RENTED">Loués</Link>
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-4">
            {isAvailableView
              ? "Aucun véhicule disponible pour le moment"
              : isRentedView
                ? "Aucun véhicule actuellement en location"
                : "Aucun véhicule enregistré"}
          </p>
          {!isRentedView && (
            <Button asChild>
              <Link href="/vehicles/add">Ajouter votre premier véhicule</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-xl bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Plaque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Année
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Couleur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Prix/Jour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Statut
                  </th>
                  {isRentedView && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Début location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Fin location
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vehicles.map((vehicle) => {
                  const activeBooking = "bookings" in vehicle ? vehicle.bookings?.[0] : null;
                  return (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-muted/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {vehicle.make}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.model}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {vehicle.plate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {vehicle.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {vehicle.color}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {formatCurrency(vehicle.pricePerDay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={vehicle.status} />
                      </td>
                      {isRentedView && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {activeBooking ? (
                              <Link
                                href={`/customers/${activeBooking.customer.id}`}
                                className="text-primary hover:underline"
                              >
                                {activeBooking.customer.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {activeBooking
                              ? formatDate(activeBooking.startDate)
                              : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {activeBooking
                              ? formatDate(activeBooking.endDate)
                              : "—"}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/vehicles/${vehicle.id}/edit`}>
                              <Edit className="h-4 w-4 mr-1" />
                              Modifier
                            </Link>
                          </Button>
                          <DeleteVehicleButton vehicleId={vehicle.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
