import { BookingStatus } from "@prisma/client";
import type { ActiveBookingSlot, BookingCustomerOption, BookingVehicleOption } from "@/components/bookings/types";
import { prisma } from "@/lib/prisma";

interface GetBookingFormOptionsInput {
  agencyId: string;
  excludeBookingId?: string;
}

interface BookingFormOptions {
  customers: BookingCustomerOption[];
  vehicles: BookingVehicleOption[];
  locationOptions: string[];
  activeBookings: ActiveBookingSlot[];
}

export async function getBookingFormOptions(
  input: GetBookingFormOptionsInput
): Promise<BookingFormOptions> {
  const { agencyId, excludeBookingId } = input;

  const [customers, vehicles, locations, activeBookings] = await Promise.all([
    prisma.customer.findMany({
      where: { agencyId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    }),
    prisma.vehicle.findMany({
      where: { agencyId },
      orderBy: [{ make: "asc" }, { model: "asc" }],
      select: {
        id: true,
        make: true,
        model: true,
        plate: true,
        pricePerDay: true,
        depositAmount: true,
        category: true,
        gearbox: true,
        status: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        agencyId,
        OR: [{ pickupLocation: { not: null } }, { returnLocation: { not: null } }],
      },
      select: {
        pickupLocation: true,
        returnLocation: true,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: {
        agencyId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: {
        id: true,
        vehicleId: true,
        startDate: true,
        endDate: true,
      },
    }),
  ]);

  const locationSet = new Set<string>(["Agence", "Aéroport", "Centre-ville"]);
  for (const row of locations) {
    if (row.pickupLocation) locationSet.add(row.pickupLocation);
    if (row.returnLocation) locationSet.add(row.returnLocation);
  }

  return {
    customers: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      bookingCount: 0,
      lastBookingAt: null,
      unpaidCount: 0,
      isVip: false,
      isBlacklisted: false,
    })),
    vehicles,
    locationOptions: Array.from(locationSet),
    activeBookings,
  };
}
