"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isVehicleAvailable } from "@/lib/availability";
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

  // 1. Re-check availability server-side
  const available = await isVehicleAvailable(data.vehicleId, data.startDate, data.endDate);
  if (!available) {
    return {
      error: "Ce véhicule vient d’être réservé sur ces dates. Choisissez un autre véhicule.",
    };
  }

  try {
    // 2. Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        agencyId: session.user.agencyId,
        phone: data.customerPhone,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          agencyId: session.user.agencyId,
          name: data.customerName,
          phone: data.customerPhone,
          passportOrCIN: "PENDING", // Placeholder for rapid mode
        },
      });
    }

    // 3. Create booking
    const booking = await prisma.booking.create({
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
      }
    });

    revalidatePath("/catalogue");
    revalidatePath("/bookings");
    revalidatePath("/dashboard");

    return { success: true, booking };
  } catch (error) {
    console.error("Booking error:", error);
    return { error: "Une erreur est survenue lors de la création de la réservation." };
  }
}
