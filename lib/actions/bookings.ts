"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { PaymentType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingSchema, BookingFormData } from "@/lib/validations/booking";

export async function createBooking(data: BookingFormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  try {
    const validatedData = bookingSchema.parse(data);

    // Check for overlapping bookings
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    const overlappingCount = await prisma.booking.count({
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

    if (overlappingCount > 0) {
      return {
        error:
          "Ce véhicule n'est pas disponible pour ces dates. Il existe déjà une réservation.",
      };
    }

    // Create booking with payment and deposit
    const paymentStatus =
      validatedData.remainingAmount <= 0
        ? "PAID"
        : validatedData.paidNow > 0
          ? "PARTIAL"
          : "PENDING";

    // NOTE: Some deployed environments may not have PaymentType.OTHER in Prisma client yet.
    // Keep "Autre" in UI, but persist with a compatible enum value until schema/client are aligned.
    const normalizedPaymentType: PaymentType =
      validatedData.paymentType === "OTHER"
        ? PaymentType.TRANSFER
        : validatedData.paymentType;

    const createdBooking = await prisma.booking.create({
      data: {
        agencyId: session.user.agencyId,
        customerId: validatedData.customerId,
        vehicleId: validatedData.vehicleId,
        startDate,
        endDate,
        pickupLocation: validatedData.pickupLocation || null,
        returnLocation: validatedData.returnLocation || null,
        pricePerDay: validatedData.pricePerDay,
        totalPrice: validatedData.totalTtc,
        pricingDays: validatedData.pricingDays,
        pricingHours: validatedData.pricingHours,
        addonsTotal: validatedData.addonsTotal,
        discountType: validatedData.discountType ?? null,
        discountValue: validatedData.discountValue,
        discountAmount: validatedData.discountAmount,
        taxEnabled: validatedData.taxEnabled,
        taxRate: validatedData.taxRate,
        totalHt: validatedData.totalHt,
        totalTva: validatedData.totalTva,
        totalTtc: validatedData.totalTtc,
        paidNow: validatedData.paidNow,
        remainingAmount: validatedData.remainingAmount,
        flowVersion: "reservation_flow_v2",
        depositAmount: validatedData.depositAmount,
        status: validatedData.status,
        paymentStatus,
        notes: validatedData.notes || null,
        payments: {
          create:
            validatedData.paidNow > 0
              ? {
                  amount: validatedData.paidNow,
                  type: normalizedPaymentType,
                  status: "PAID",
                }
              : {
                  amount: 0,
                  type: normalizedPaymentType,
                  status: "PENDING",
                },
        },
        deposit: {
          create: {
            amount: validatedData.depositAmount,
            status: "HELD",
          },
        },
        addons: {
          create: validatedData.addons.map((addon) => ({
            label: addon.label,
            quantity: addon.quantity,
            unitAmount: addon.unitAmount,
            totalAmount: addon.quantity * addon.unitAmount,
            isDefault: addon.isDefault ?? false,
          })),
        },
      },
      select: { id: true },
    });

    revalidatePath("/bookings");
    revalidatePath("/dashboard");
    revalidatePath("/bookings/create");
    return { success: true, bookingId: createdBooking.id };
  } catch (error) {
    console.error("createBooking error:", error);
    return { error: "Erreur lors de la création de la réservation" };
  }
}

export async function saveBookingDraftPlaceholder(data: {
  step: number;
  vehicleId?: string;
  clientId?: string;
  total?: number;
}) {
  void data;
  return { success: true };
}

export async function updateBookingStatus(
  bookingId: string,
  status: "ACTIVE" | "COMPLETED" | "CANCELED"
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, agencyId: true, vehicleId: true, status: true },
    });

    if (!booking || booking.agencyId !== session.user.agencyId) {
      throw new Error("Réservation non trouvée");
    }

    // Atomic transaction: update booking + vehicle status together to prevent inconsistency
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status },
      });

      if (status === "ACTIVE") {
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: "RENTED" },
        });
      } else if (status === "COMPLETED" || status === "CANCELED") {
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: "AVAILABLE" },
        });
      }
    });

    revalidatePath("/bookings");
    revalidatePath("/dashboard");
    revalidatePath(`/bookings/${bookingId}`);
  } catch (error) {
    console.error("updateBookingStatus error:", error);
    throw new Error("Erreur lors de la mise à jour du statut de la réservation");
  }
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
