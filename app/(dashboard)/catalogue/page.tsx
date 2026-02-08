import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CatalogueFilters } from "./_components/CatalogueFilters";
import { VehicleCard } from "./_components/VehicleCard";
import { getVehicleAvailabilityStatus } from "@/lib/availability";

export const dynamic = "force-dynamic";

interface CataloguePageProps {
  searchParams: Promise<{
    search?: string;
    start?: string;
    end?: string;
    category?: string;
    gearbox?: string;
  }>;
}

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const search = params.search || "";
  const startDate = params.start ? new Date(params.start) : new Date();
  const endDate = params.end ? new Date(params.end) : new Date(Date.now() + 86400000);

  // Fetch vehicles with basic filters (include photoUrl for catalogue cards)
  const vehicles = await prisma.vehicle.findMany({
    where: {
      agencyId: session.user.agencyId,
      OR: search ? [
        { make: { contains: search } },
        { model: { contains: search } },
        { plate: { contains: search } },
        { category: { contains: search } },
      ] : undefined,
    },
    orderBy: {
      pricePerDay: "asc",
    },
  });

  // Compute availability for each vehicle
  const vehiclesWithAvailability = await Promise.all(
    vehicles.map(async (vehicle) => {
      const availability = await getVehicleAvailabilityStatus(
        vehicle.id,
        startDate,
        endDate
      );
      return { ...vehicle, availability };
    })
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6" suppressHydrationWarning>
      <PageHeader
        title="Catalogue"
        description="Sélectionnez des dates pour voir les véhicules disponibles"
      />

      <CatalogueFilters />

      {vehiclesWithAvailability.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center" suppressHydrationWarning>
          <p className="text-lg font-medium text-muted-foreground">
            Aucun véhicule ne correspond à vos filtres.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" suppressHydrationWarning>
          {vehiclesWithAvailability.map((vehicle) => (
            <VehicleCard 
              key={vehicle.id} 
              vehicle={vehicle} 
              startDate={startDate}
              endDate={endDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
