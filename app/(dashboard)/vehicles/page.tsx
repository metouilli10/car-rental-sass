import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit } from "lucide-react";
import { DeleteVehicleButton } from "@/components/vehicles/delete-vehicle-button";
import type { VehicleStatus } from "@prisma/client";

const PAGE_SIZE = 25;

type SearchParams = { status?: string; page?: string };

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const { status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const statusFilter =
    status === "AVAILABLE" || status === "RENTED" || status === "MAINTENANCE"
      ? (status as VehicleStatus)
      : undefined;

  const where = {
    agencyId: session.user.agencyId,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include:
        statusFilter === "RENTED"
          ? {
              bookings: {
                where: { status: "ACTIVE" },
                take: 1,
                select: {
                  startDate: true,
                  endDate: true,
                  customer: { select: { id: true, name: true } },
                },
              },
            }
          : undefined,
    }),
    prisma.vehicle.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
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
    <div className="space-y-8">
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

      {vehicles.length === 0 && page === 1 ? (
        <div className="text-center py-16 rounded-2xl bg-white shadow-card">
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
        <div className="rounded-2xl bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-transparent border-b border-muted">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Plaque
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Année
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Couleur
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Prix/Jour
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Statut
                  </th>
                  {isRentedView && (
                    <>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Début location
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Fin location
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/60">
                {vehicles.map((vehicle) => {
                  const activeBooking = "bookings" in vehicle ? (vehicle.bookings as Array<{ startDate: Date; endDate: Date; customer: { id: string; name: string } }>)?.[0] : null;
                  return (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-muted/40 transition-colors duration-200"
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
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/vehicles"
            searchParams={{ status }}
          />
        </div>
      )}
    </div>
  );
}
