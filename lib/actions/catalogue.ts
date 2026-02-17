"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingStatus, PaymentType } from "@prisma/client";

export type RapidBookingData = {
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  customerName: string;
  customerPhone: string;
  pricePerDay: number;
  totalPrice: number;
  depositAmount: number;
  pickupLocation: string;
  paymentType: PaymentType;
  notes?: string;
  isRapidMode: boolean;
};

export async function createCatalogueBooking(data: RapidBookingData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");

  try {
    // Atomic transaction: check availability + find/create customer + create booking
    // Prevents race condition where two users book the same vehicle simultaneously
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Re-check availability inside transaction
      const overlappingCount = await tx.booking.count({
        where: {
          vehicleId: data.vehicleId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
          startDate: { lt: data.endDate },
          endDate: { gt: data.startDate },
        },
      });
      if (overlappingCount > 0) {
        throw new Error("VEHICLE_UNAVAILABLE");
      }

      // 2. Find or create customer (only select id -- that's all we need)
      let customer = await tx.customer.findFirst({
        where: {
          agencyId: session.user.agencyId,
          phone: data.customerPhone,
        },
        select: { id: true },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            agencyId: session.user.agencyId,
            name: data.customerName,
            phone: data.customerPhone,
            passportOrCIN: "PENDING",
          },
          select: { id: true },
        });
      }

      // 3. Create booking
      return tx.booking.create({
        data: {
          agencyId: session.user.agencyId,
          vehicleId: data.vehicleId,
          customerId: customer.id,
          startDate: data.startDate,
          endDate: data.endDate,
          pricePerDay: data.pricePerDay,
          totalPrice: data.totalPrice,
          depositAmount: data.depositAmount,
          status: data.isRapidMode ? BookingStatus.DRAFT : BookingStatus.CONFIRMED,
          notes: data.notes,
          payments: {
            create: {
              amount: data.totalPrice,
              type: data.paymentType,
              status: "PENDING",
            },
          },
          deposit: {
            create: {
              amount: data.depositAmount,
              status: "HELD",
            },
          },
        },
        include: {
          vehicle: true,
        },
      });
    });

    revalidatePath("/catalogue");
    revalidatePath("/bookings");
    revalidatePath("/dashboard");

    return { success: true, booking };
  } catch (error) {
    if (error instanceof Error && error.message === "VEHICLE_UNAVAILABLE") {
      return {
        error: "Ce véhicule vient d'être réservé sur ces dates. Choisissez un autre véhicule.",
      };
    }
    console.error("Booking error:", error);
    return { error: "Une erreur est survenue lors de la création de la réservation." };
  }
}
