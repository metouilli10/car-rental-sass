import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { CatalogueFilters } from "./_components/CatalogueFilters";
import { VehicleCard } from "./_components/VehicleCard";
import { BookingStatus, Gearbox, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 24;

const catalogueVehicleSelect = Prisma.validator<Prisma.VehicleSelect>()({
  id: true,
  make: true,
  model: true,
  plate: true,
  category: true,
  year: true,
  pricePerDay: true,
  depositAmount: true,
  gearbox: true,
  seats: true,
  hasAC: true,
  photoUrl: true,
  status: true,
});

type CatalogueVehicle = Prisma.VehicleGetPayload<{
  select: typeof catalogueVehicleSelect;
}>;

interface CataloguePageProps {
  searchParams: Promise<{
    search?: string;
    start?: string;
    end?: string;
    category?: string;
    gearbox?: string;
    availability?: string;
    sort?: string;
    page?: string;
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
  const page = Math.max(1, Number(params.page) || 1);
  const gearbox =
    params.gearbox === Gearbox.AUTO || params.gearbox === Gearbox.MANUAL
      ? params.gearbox
      : undefined;
  const startDate = params.start ? new Date(params.start) : new Date();
  const endDate = params.end ? new Date(params.end) : new Date(Date.now() + 86400000);
  const availabilityAwareMode = Boolean(availability) || sort === "availability";

  const baseWhere = {
    agencyId: session.user.agencyId,
    ...(category ? { category } : {}),
    ...(gearbox ? { gearbox } : {}),
    ...(search
      ? {
          OR: [
            { make: { contains: search } },
            { model: { contains: search } },
            { plate: { contains: search } },
            { category: { contains: search } },
          ],
        }
      : {}),
  };

  const categoriesPromise = prisma.vehicle.findMany({
    where: { agencyId: session.user.agencyId },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });

  let vehicles: CatalogueVehicle[] = [];
  let conflictingBookings: Array<{ vehicleId: string; status: BookingStatus; endDate: Date }> = [];
  let total = 0;

  if (availabilityAwareMode) {
    const [allVehicles, allConflictingBookings, categories] = await Promise.all([
      prisma.vehicle.findMany({
        where: baseWhere,
        select: catalogueVehicleSelect,
        orderBy: {
          pricePerDay: "asc",
        },
      }),
      prisma.booking.findMany({
        where: {
          agencyId: session.user.agencyId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
          startDate: { lt: endDate },
          endDate: { gt: startDate },
        },
        select: { vehicleId: true, status: true, endDate: true },
      }),
      categoriesPromise,
    ]);
    vehicles = allVehicles;
    conflictingBookings = allConflictingBookings;
    total = allVehicles.length;

    const unavailableVehicleIds = new Set(conflictingBookings.map((b) => b.vehicleId));
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
    const returningTodayMap = new Map<string, Date>();
    for (const b of conflictingBookings) {
      if (b.status === BookingStatus.ACTIVE && b.endDate >= todayStart && b.endDate <= todayEnd) {
        returningTodayMap.set(b.vehicleId, b.endDate);
      }
    }

    const vehiclesWithAvailability = vehicles.map((vehicle) => {
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

    total = sortedVehicles.length;
    vehicles = sortedVehicles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const categoriesList = categories.map((vehicle) => vehicle.category);

    return renderCatalogue({
      categories: categoriesList,
      vehicles: vehicles as Array<(typeof sortedVehicles)[number]>,
      startDate,
      endDate,
      total,
      page,
      search,
      category,
      gearbox,
      availability,
      sort,
    });
  }

  const [pagedVehicles, totalCount, categories] = await Promise.all([
    prisma.vehicle.findMany({
      where: baseWhere,
      select: catalogueVehicleSelect,
      orderBy:
        sort === "price_desc"
          ? { pricePerDay: "desc" }
          : sort === "name"
          ? [{ make: "asc" }, { model: "asc" }]
          : { pricePerDay: "asc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.vehicle.count({ where: baseWhere }),
    categoriesPromise,
  ]);

  vehicles = pagedVehicles;
  total = totalCount;

  conflictingBookings =
    vehicles.length > 0
      ? await prisma.booking.findMany({
          where: {
            agencyId: session.user.agencyId,
            vehicleId: { in: vehicles.map((vehicle) => vehicle.id) },
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
            startDate: { lt: endDate },
            endDate: { gt: startDate },
          },
          select: { vehicleId: true, status: true, endDate: true },
        })
      : [];

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

  const categoriesList = categories.map((vehicle) => vehicle.category);

  return renderCatalogue({
    categories: categoriesList,
    vehicles: vehiclesWithAvailability,
    startDate,
    endDate,
    total,
    page,
    search,
    category,
    gearbox,
    availability,
    sort,
  });
}

function renderCatalogue({
  categories,
  vehicles,
  startDate,
  endDate,
  total,
  page,
  search,
  category,
  gearbox,
  availability,
  sort,
}: {
  categories: string[];
  vehicles: Array<
    CatalogueVehicle & {
      availability: {
        status: "AVAILABLE" | "UNAVAILABLE" | "RETURNING_TODAY";
        time?: Date;
      };
    }
  >;
  startDate: Date;
  endDate: Date;
  total: number;
  page: number;
  search: string;
  category: string;
  gearbox?: Gearbox;
  availability: string;
  sort: string;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-8" suppressHydrationWarning>
      <PageHeader
        title="Catalogue"
        description="Sélectionnez des dates pour voir les véhicules disponibles"
      />

      <CatalogueFilters categories={categories} />

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center" suppressHydrationWarning>
          <p className="text-lg font-medium text-muted-foreground">
            Aucun véhicule ne correspond à vos filtres.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" suppressHydrationWarning>
            {vehicles.map((vehicle) => (
              <VehicleCard 
                key={vehicle.id} 
                vehicle={vehicle} 
                startDate={startDate}
                endDate={endDate}
              />
            ))}
          </div>
          <div className="rounded-xl border border-border bg-white shadow-sm">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl="/catalogue"
              searchParams={{
                ...(search ? { search } : {}),
                ...(category ? { category } : {}),
                ...(gearbox ? { gearbox } : {}),
                ...(availability ? { availability } : {}),
                ...(sort ? { sort } : {}),
                start: startDate.toISOString(),
                end: endDate.toISOString(),
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
