import { Prisma, BookingRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const publicVehicleSelect = {
  id: true,
  make: true,
  model: true,
  year: true,
  category: true,
  photoUrl: true,
  seats: true,
  fuelType: true,
  gearbox: true,
  pricePerDay: true,
} satisfies Prisma.VehicleSelect;

export type PublicVehicle = Prisma.VehicleGetPayload<{
  select: typeof publicVehicleSelect;
}>;

export const bookingRequestListSelect = {
  id: true,
  bookingId: true,
  fullName: true,
  email: true,
  phone: true,
  pickupDate: true,
  returnDate: true,
  pickupLocation: true,
  returnLocation: true,
  note: true,
  status: true,
  source: true,
  isRead: true,
  readAt: true,
  createdAt: true,
  vehicle: {
    select: {
      id: true,
      make: true,
      model: true,
      plate: true,
      photoUrl: true,
      status: true,
    },
  },
} satisfies Prisma.BookingRequestSelect;

export type BookingRequestOperationalState =
  | "AVAILABLE"
  | "INTERNAL_CONFLICT"
  | "TO_CONFIRM"
  | "PARTNER_AGENCY";

export type BookingRequestListItem = Prisma.BookingRequestGetPayload<{
  select: typeof bookingRequestListSelect;
}> & {
  operationalState: BookingRequestOperationalState;
};

export type WebsiteSettingsWithAgency = Prisma.WebsiteSettingsGetPayload<{
  include: {
    agency: {
      select: {
        id: true;
        name: true;
        city: true;
        address: true;
        phone: true;
        email: true;
        logoUrl: true;
      };
    };
  };
}>;

export async function getWebsiteSettingsBySlug(agencySlug: string) {
  return prisma.websiteSettings.findUnique({
    where: { agencySlug },
    include: {
      agency: {
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          phone: true,
          email: true,
          logoUrl: true,
        },
      },
    },
  });
}

export async function getWebsiteSettingsForAgency(agencyId: string) {
  return prisma.websiteSettings.findUnique({
    where: { agencyId },
  });
}

export async function getEnabledStorefrontSlugs() {
  return prisma.websiteSettings.findMany({
    where: {
      isWebsiteEnabled: true,
    },
    select: {
      agencySlug: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPublishedVehiclesBySlug(agencySlug: string) {
  const settings = await getWebsiteSettingsBySlug(agencySlug);
  if (!settings || !settings.isWebsiteEnabled) return null;

  const vehicles = await prisma.vehicle.findMany({
    where: {
      agencyId: settings.agencyId,
      publishedToWebsite: true,
    },
    select: publicVehicleSelect,
    orderBy: [
      { pricePerDay: "asc" },
      { make: "asc" },
      { model: "asc" },
    ],
  });

  return { settings, vehicles };
}

export async function getPublishedVehicleBySlugAndVehicleId(agencySlug: string, vehicleId: string) {
  const settings = await getWebsiteSettingsBySlug(agencySlug);
  if (!settings || !settings.isWebsiteEnabled) return null;

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      agencyId: settings.agencyId,
      publishedToWebsite: true,
    },
    select: publicVehicleSelect,
  });

  if (!vehicle) return null;
  return { settings, vehicle };
}

export async function getBookingRequestsForAgency(
  agencyId: string,
  filters?: {
    status?: BookingRequestStatus | "ALL";
    search?: string;
    requestId?: string;
  },
) {
  const requestId = filters?.requestId?.trim();
  const search = filters?.search?.trim();
  const requests = await prisma.bookingRequest.findMany({
    where: {
      agencyId,
      ...(requestId
        ? { id: requestId }
        : {
            ...(filters?.status && filters.status !== "ALL" ? { status: filters.status } : {}),
            ...(search
              ? {
                  OR: [
                    { id: { contains: search, mode: "insensitive" } },
                    { fullName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search } },
                    { vehicle: { make: { contains: search, mode: "insensitive" } } },
                    { vehicle: { model: { contains: search, mode: "insensitive" } } },
                    { vehicle: { plate: { contains: search, mode: "insensitive" } } },
                  ],
                }
              : {}),
          }),
    },
    select: bookingRequestListSelect,
    orderBy: { createdAt: "desc" },
  });

  if (requests.length === 0) {
    return [] satisfies BookingRequestListItem[];
  }

  const vehicleIds = Array.from(new Set(requests.map((request) => request.vehicle.id)));
  const minPickupDate = requests.reduce(
    (minDate, request) => (request.pickupDate < minDate ? request.pickupDate : minDate),
    requests[0].pickupDate,
  );
  const maxReturnDate = requests.reduce(
    (maxDate, request) => (request.returnDate > maxDate ? request.returnDate : maxDate),
    requests[0].returnDate,
  );

  const overlappingBookings = await prisma.booking.findMany({
    where: {
      agencyId,
      vehicleId: { in: vehicleIds },
      status: { notIn: ["CANCELED", "COMPLETED"] },
      startDate: { lt: maxReturnDate },
      endDate: { gt: minPickupDate },
    },
    select: {
      id: true,
      vehicleId: true,
      startDate: true,
      endDate: true,
    },
  });

  return requests.map((request) => {
    const hasInternalConflict = overlappingBookings.some(
      (booking) =>
        booking.vehicleId === request.vehicle.id &&
        request.pickupDate < booking.endDate &&
        request.returnDate > booking.startDate,
    );

    const operationalState: BookingRequestOperationalState = hasInternalConflict
      ? "INTERNAL_CONFLICT"
      : request.vehicle.status === "MAINTENANCE" || request.vehicle.status === "UNAVAILABLE"
        ? "PARTNER_AGENCY"
        : request.status === "PENDING"
          ? "TO_CONFIRM"
          : "AVAILABLE";

    return {
      ...request,
      operationalState,
    };
  });
}
