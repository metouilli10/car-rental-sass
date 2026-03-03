import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CatalogueFilters } from "./_components/CatalogueFilters";
import { VehicleCard } from "./_components/VehicleCard";
import { BookingStatus, Gearbox } from "@prisma/client";

export const dynamic = "force-dynamic";

interface CataloguePageProps {
  searchParams: Promise<{
    search?: string;
    start?: string;
    end?: string;
    category?: string;
    gearbox?: string;
    availability?: string;
    sort?: string;
  }>;
}

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const search = params.search || "";
  const category = params.category || "";
  const availability = params.availability || "";
  const sort = params.sort || "availability";
  const gearbox =
    params.gearbox === Gearbox.AUTO || params.gearbox === Gearbox.MANUAL
      ? params.gearbox
      : undefined;
  const startDate = params.start ? new Date(params.start) : new Date();
  const endDate = params.end ? new Date(params.end) : new Date(Date.now() + 86400000);

  // Fetch vehicles and conflicting bookings in parallel (2 queries instead of N+1)
  const [vehicles, conflictingBookings] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        agencyId: session.user.agencyId,
        ...(category ? { category } : {}),
        ...(gearbox ? { gearbox } : {}),
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
    }),
    // Single query to find all bookings conflicting with the requested date range
    prisma.booking.findMany({
      where: {
        agencyId: session.user.agencyId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
      select: { vehicleId: true, status: true, endDate: true },
    }),
  ]);

  // Compute availability in-memory from the batch query results
  const unavailableVehicleIds = new Set(conflictingBookings.map(b => b.vehicleId));
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
  const returningTodayMap = new Map<string, Date>();
  for (const b of conflictingBookings) {
    if (b.status === BookingStatus.ACTIVE && b.endDate >= todayStart && b.endDate <= todayEnd) {
      returningTodayMap.set(b.vehicleId, b.endDate);
    }
  }

  const vehiclesWithAvailability = vehicles.map((vehicle) => {
    // Synced with vehicle page: MAINTENANCE / UNAVAILABLE are always indisponible
    if (vehicle.status === "MAINTENANCE" || vehicle.status === "UNAVAILABLE") {
      return { ...vehicle, availability: { status: "UNAVAILABLE" as const } };
    }
    if (unavailableVehicleIds.has(vehicle.id)) {
      return { ...vehicle, availability: { status: "UNAVAILABLE" as const } };
    }
    const returningTime = returningTodayMap.get(vehicle.id);
    if (returningTime) {
      return { ...vehicle, availability: { status: "RETURNING_TODAY" as const, time: returningTime } };
    }
    return { ...vehicle, availability: { status: "AVAILABLE" as const } };
  });

  const filteredVehicles = vehiclesWithAvailability.filter((vehicle) => {
    if (!availability) return true;
    return vehicle.availability.status === availability;
  });

  const availabilityPriority = {
    AVAILABLE: 0,
    RETURNING_TODAY: 1,
    UNAVAILABLE: 2,
  } as const;

  const sortedVehicles = [...filteredVehicles].sort((left, right) => {
    switch (sort) {
      case "price_desc":
        return right.pricePerDay - left.pricePerDay;
      case "name":
        return `${left.make} ${left.model}`.localeCompare(`${right.make} ${right.model}`);
      case "price_asc":
        return left.pricePerDay - right.pricePerDay;
      case "availability":
      default: {
        const byAvailability =
          availabilityPriority[left.availability.status] - availabilityPriority[right.availability.status];
        if (byAvailability !== 0) return byAvailability;
        return left.pricePerDay - right.pricePerDay;
      }
    }
  });

  const categories = [...new Set(vehicles.map((vehicle) => vehicle.category))].sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <div className="space-y-8" suppressHydrationWarning>
      <PageHeader
        title="Catalogue"
        description="Sélectionnez des dates pour voir les véhicules disponibles"
      />

      <CatalogueFilters categories={categories} />

      {sortedVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center" suppressHydrationWarning>
          <p className="text-lg font-medium text-muted-foreground">
            Aucun véhicule ne correspond à vos filtres.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" suppressHydrationWarning>
          {sortedVehicles.map((vehicle) => (
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
