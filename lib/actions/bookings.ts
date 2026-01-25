"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingSchema, BookingFormData } from "@/lib/validations/booking";

export async function createBooking(data: BookingFormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const validatedData = bookingSchema.parse(data);

  // Check for overlapping bookings
  const startDate = new Date(validatedData.startDate);
  const endDate = new Date(validatedData.endDate);

  const overlappingBookings = await prisma.booking.findMany({
    where: {
      vehicleId: validatedData.vehicleId,
      status: { notIn: ["CANCELED", "COMPLETED"] },
      OR: [
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: startDate } },
          ],
        },
        {
          AND: [{ startDate: { lte: endDate } }, { endDate: { gte: endDate } }],
        },
        {
          AND: [
            { startDate: { gte: startDate } },
            { endDate: { lte: endDate } },
          ],
        },
      ],
    },
  });

  if (overlappingBookings.length > 0) {
    throw new Error(
      "Ce véhicule n'est pas disponible pour ces dates. Il existe déjà une réservation."
    );
  }

  // Create booking with payment and deposit
  const booking = await prisma.booking.create({
    data: {
      agencyId: session.user.agencyId,
      customerId: validatedData.customerId,
      vehicleId: validatedData.vehicleId,
      startDate,
      endDate,
      pricePerDay: validatedData.pricePerDay,
      totalPrice: validatedData.totalPrice,
      depositAmount: validatedData.depositAmount,
      status: "CONFIRMED",
      notes: validatedData.notes || null,
      payments: {
        create: {
          amount: validatedData.totalPrice,
          type: validatedData.paymentType,
          status: "PENDING",
        },
      },
      deposit: {
        create: {
          amount: validatedData.depositAmount,
          status: "HELD",
        },
      },
    },
  });

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  redirect("/bookings");
}

export async function updateBookingStatus(
  bookingId: string,
  status: "ACTIVE" | "COMPLETED" | "CANCELED"
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vehicle: true },
  });

  if (!booking || booking.agencyId !== session.user.agencyId) {
    throw new Error("Réservation non trouvée");
  }

  // Update booking status
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });

  // Update vehicle status based on booking status
  if (status === "ACTIVE") {
    await prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { status: "RENTED" },
    });
  } else if (status === "COMPLETED" || status === "CANCELED") {
    await prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { status: "AVAILABLE" },
    });
  }

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  revalidatePath(`/bookings/${bookingId}`);
}

export async function cancelBooking(bookingId: string) {
  return updateBookingStatus(bookingId, "CANCELED");
}

export async function startBooking(bookingId: string) {
  return updateBookingStatus(bookingId, "ACTIVE");
}

export async function completeBooking(bookingId: string) {
  return updateBookingStatus(bookingId, "COMPLETED");
}
