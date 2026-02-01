import { prisma } from "./prisma";
import { BookingStatus } from "@prisma/client";

/**
 * Checks if a vehicle is available for a given date range.
 * A vehicle is available if it has no overlapping bookings with status CONFIRMED or ACTIVE.
 */
export async function isVehicleAvailable(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
) {
  const overlappingBookings = await prisma.booking.count({
    where: {
      vehicleId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
      },
      // Overlap logic: (StartA < EndB) AND (EndA > StartB)
      startDate: {
        lt: endDate,
      },
      endDate: {
        gt: startDate,
      },
    },
  });

  return overlappingBookings === 0;
}

/**
 * Computes availability status for a vehicle on a specific date range.
 */
export async function getVehicleAvailabilityStatus(
  vehicleId: string,
  startDate: Date,
  endDate: Date
) {
  const isAvailable = await isVehicleAvailable(vehicleId, startDate, endDate);
  
  if (isAvailable) {
    // Check if it's returning today
    const returningToday = await prisma.booking.findFirst({
      where: {
        vehicleId,
        status: BookingStatus.ACTIVE,
        endDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    if (returningToday) {
      return {
        status: "RETURNING_TODAY" as const,
        time: returningToday.endDate,
      };
    }

    return { status: "AVAILABLE" as const };
  }

  return { status: "UNAVAILABLE" as const };
}
